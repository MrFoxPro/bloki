import { VBO_ARRAY } from './utils'
import { isBlink } from '@solid-primitives/platform'
import { MeshGroup } from './mesh_group'
import { SingleColorStrokeShaderCode } from './objects/line/line2d'

export class Renderer {
   readonly mGroups: MeshGroup[] = []
   private shaderModule: GPUShaderModule

   // target
   private ctx: GPUCanvasContext
   private _device: GPUDevice
   private mainFormat: GPUTextureFormat
   private pxRatio = window.devicePixelRatio | 1

   // settings
   private powerPreference: GPUPowerPreference = 'low-power'
   private _sampleCount = 4

   // realtime
   private attachment: GPURenderPassColorAttachment = {
      storeOp: 'store',
      loadOp: 'clear',
      clearValue: [0, 0, 0, 0],
      resolveTarget: undefined,
      view: undefined,
   }

   // internal
   readonly globalBindGroups: { index: number; group: GPUBindGroup }[] = []
   public pipeline: GPURenderPipeline

   get inited() {
      return !!this._device
   }
   get device() {
      return this._device
   }
   addMeshGroup(group: MeshGroup) {
      this.mGroups.push(group)
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

      if (import.meta.env.DEV) this.printAdapterInfo(adapter)

      this.ctx = canvas.getContext('webgpu')
      this.mainFormat = navigator.gpu.getPreferredCanvasFormat()

      this.ctx.configure({
         device: this._device,
         format: this.mainFormat,
         alphaMode: 'premultiplied',
      })
   }

   get screenFormat() {
      return this.mainFormat
   }

   buildPipelines() {
      this.shaderModule ??= this._device.createShaderModule({ code: SingleColorStrokeShaderCode })
      this.updateSampling()

      // const bindGroupLayouts: GPUBindGroupLayout[] = this.globalBindGroups.map((g) => g.layout)
      // const pipelineLayout = this._device.createPipelineLayout({
      //    bindGroupLayouts,
      // })

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
      this.pipeline = this.device.createRenderPipeline({
         layout: 'auto',
         // layout: pipelineLayout,
         vertex: vertexState,
         fragment: fragmentState,
         primitive: primitiveState,
         multisample: multisampleState,
      })
   }

   async printAdapterInfo(adapter: GPUAdapter) {
      // console.log('Limits', adapter.limits)
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
      const commandEncoder = this.device.createCommandEncoder()

      const view = this.ctx.getCurrentTexture().createView()
      if (this._sampleCount > 1) this.attachment.resolveTarget = view
      else this.attachment.view = view

      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.attachment],
      })
      // if (this.renderBundle) pass.executeBundles([this.renderBundle])

      // pass.setBindGroup(0, this.uniformBindGroup)
      for (const { index, group } of this.globalBindGroups) {
         pass.setBindGroup(index, group)
      }
      pass.setPipeline(this.pipeline)
      for (const mGroup of this.mGroups) {
         mGroup.recordRender(pass)
      }
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])
   }
}
