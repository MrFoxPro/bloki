import { BufferPool } from './buffer/pool'
import { UBO_ARRAY, VBO_ARRAY } from './utils'
import { isBlink } from '@solid-primitives/platform'
import { Chunk } from './buffer/chunk'
import { MeshGroup } from './mesh_group'
import { SingleColorStrokeShaderCode } from './objects/line/line2d'

// TODO: split to scene and renderer
export class WebGPURenderer {
   readonly mGroups: MeshGroup[] = []
   private viewportChunk: Chunk
   private shaderModule: GPUShaderModule

   // target
   private ctx: GPUCanvasContext
   private _device: GPUDevice
   private mainFormat: GPUTextureFormat
   private pxRatio = window.devicePixelRatio | 1

   // settings
   private powerPreference: GPUPowerPreference = 'low-power'
   private _sampleCount = 4
   private _zoom = 1

   // realtime
   private attachment: GPURenderPassColorAttachment = {
      storeOp: 'store',
      loadOp: 'clear',
      clearValue: [0, 0, 0, 0],
      resolveTarget: undefined,
      view: undefined,
   }

   // internal
   private uniformBindGroup: GPUBindGroup
   private pipeline: GPURenderPipeline

   get inited() {
      return !!this._device
   }
   get device() {
      return this._device
   }
   addMeshGroup(group: MeshGroup) {
      this.mGroups.push(group)
   }
   get zoom() {
      return this._zoom
   }
   set zoom(value: number) {
      if (this._zoom === value) return

      this._zoom = value

      this._device.queue.writeBuffer(
         this.viewportChunk.manager.buffer,
         3 * UBO_ARRAY.BYTES_PER_ELEMENT,
         new UBO_ARRAY([value])
      )
   }

   get sampleCount() {
      return this._sampleCount
   }
   set sampleCount(value: number) {
      if (this._sampleCount === value) return
      this._sampleCount = value
      if (this.inited) this.buildPipelines()
      this.updateSampling(value)
   }

   async init(canvas: HTMLCanvasElement) {
      if (!isBlink) {
         throw alert('Unsupported browser')
      }
      if (!navigator.gpu) throw new Error('WebGPU is not supported on this browser.')
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: this.powerPreference })
      if (!adapter) throw new Error('WebGPU supported but disabled')
      this._device = await adapter.requestDevice()

      // if (import.meta.env.DEV) this.printAdapterInfo(adapter)

      this.ctx = canvas.getContext('webgpu')
      this.mainFormat = navigator.gpu.getPreferredCanvasFormat()

      this.ctx.configure({
         device: this._device,
         format: this.mainFormat,
         alphaMode: 'premultiplied',
      })
      this.initScene()
      this.buildPipelines()
      this.render()
      return this
   }

   get screenFormat() {
      return this.mainFormat
   }

   private initScene() {
      const viewPort = [this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, 10, this._zoom]
      const ubo = new BufferPool(this._device, new UBO_ARRAY(viewPort), GPUBufferUsage.UNIFORM)
      this.viewportChunk = ubo.create(viewPort)
   }

   private buildPipelines() {
      for (const group of this.mGroups) {

      }
      this.shaderModule ??= this._device.createShaderModule({ code: SingleColorStrokeShaderCode })
      this.updateSampling()
      const uniformBindGroupLayout = this._device.createBindGroupLayout({
         entries: [
            {
               binding: 0,
               visibility: GPUShaderStage.VERTEX,
               buffer: {
                  type: 'uniform',
               },
            },
         ],
      })
      this.uniformBindGroup = this._device.createBindGroup({
         layout: uniformBindGroupLayout,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: this.viewportChunk.manager.buffer,
               },
            },
         ],
      })
      const bindGroupLayouts = [uniformBindGroupLayout]
      const pipelineLayout = this._device.createPipelineLayout({
         bindGroupLayouts,
      })

      const vertexShaderModule = this.shaderModule
      const vertexState: GPUVertexState = {
         module: vertexShaderModule,
         entryPoint: 'vertex',
         buffers: [
            {
               arrayStride: 2 * VBO_ARRAY.BYTES_PER_ELEMENT,
               stepMode: 'vertex',
               attributes: [
                  {
                     format: 'float32x2',
                     offset: 0,
                     shaderLocation: 0,
                  },
               ],
            },
         ],
      }
      const fragmentShaderModule = this.shaderModule
      const fragmentState: GPUFragmentState = {
         module: fragmentShaderModule,
         entryPoint: 'fragment',
         targets: [{ format: this.screenFormat }],
      }
      const multisampleState: GPUMultisampleState = {
         count: this.sampleCount,
      }
      const primitiveState: GPUPrimitiveState = {
         topology: 'triangle-list',
      }
      this.pipeline = this._device.createRenderPipeline({
         layout: pipelineLayout,
         vertex: vertexState,
         fragment: fragmentState,
         primitive: primitiveState,
         multisample: multisampleState,
      })
   }

   async printAdapterInfo(adapter: GPUAdapter) {
      console.log('Limits', adapter.limits)
      if (adapter.requestAdapterInfo) {
         const info = await adapter.requestAdapterInfo()
         // @ts-ignore
         console.log(info.description, '|', info.driver, '|', this.powerPreference)
      }
   }

   updateSampling(sampleCount: number = this._sampleCount) {
      this._sampleCount = sampleCount
      if (sampleCount === 1) {
         this.attachment.view = undefined
         this.attachment.resolveTarget = undefined
         return
      }
      const texture = this._device.createTexture({
         size: [this.ctx.canvas.width * this.pxRatio, this.ctx.canvas.height * this.pxRatio],
         sampleCount,
         format: this.mainFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
      })
      this.attachment.view = texture.createView()
   }
   // private renderBundle: GPURenderBundle
   // recordRenderBundle() {
   //    const renderBundleEncoder = this._device.createRenderBundleEncoder({
   //       colorFormats: [this.mainFormat],
   //       sampleCount: this.sampleCount,
   //    })
   //    renderBundleEncoder.setBindGroup(0, this.uniformBindGroup)
   //    renderBundleEncoder.setPipeline(this.pipeline)

   //    for (const mGroup of this.mGroups) {
   //       mGroup.recordRender(renderBundleEncoder)
   //    }
   //    this.renderBundle = renderBundleEncoder.finish()
   //    console.info('Recorded render bundle')
   // }
   render() {
      const commandEncoder = this._device.createCommandEncoder()

      const view = this.ctx.getCurrentTexture().createView()
      if (this._sampleCount > 1) this.attachment.resolveTarget = view
      else this.attachment.view = view

      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.attachment],
      })
      // if (this.renderBundle) pass.executeBundles([this.renderBundle])

      pass.setBindGroup(0, this.uniformBindGroup)
      pass.setPipeline(this.pipeline)
      for (const mGroup of this.mGroups) {
         mGroup.recordRender(pass)
      }

      pass.end()
      this._device.queue.submit([commandEncoder.finish()])
   }
}
