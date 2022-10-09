import { PiecewiseIndexedMeshGroup, TightIndexedMeshGroup } from './mesh_group'
import SimpleShader from './shaders/simple.wgsl?raw'
import { Pool } from './buffer/pool'
import {
   UBO_ARRAY,
   ELEMENT_PER_VERTEX,
   VBO_ARRAY,
   ELEMENT_PER_VERTEX_POS,
   ELEMENT_PER_VERTEX_COLOR,
} from './utils'
import { isBlink, isGecko } from '@solid-primitives/platform'
import { Chunk } from './buffer/chunk'

// TODO: split to scene and renderer
export class WebGPURenderer {
   // scene
   public tight: TightIndexedMeshGroup
   public piecewise: PiecewiseIndexedMeshGroup
   private viewPortChunk: Chunk
   private shaderModule: GPUShaderModule

   // target
   private ctx: GPUCanvasContext
   private device: GPUDevice
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
   uniformBindGroupLayout: GPUBindGroupLayout

   public get objects() {
      const s = this.tight.objects.values()
      const d = this.piecewise.objects.values()
      return Array.from(s).concat(Array.from(d))
   }
   public get zoom() {
      return this._zoom
   }
   public set zoom(value: number) {
      if (this._zoom === value) return

      this._zoom = value

      this.device.queue.writeBuffer(
         this.viewPortChunk.manager.buffer,
         3 * UBO_ARRAY.BYTES_PER_ELEMENT,
         new UBO_ARRAY([value])
      )
   }

   public get sampleCount() {
      return this._sampleCount
   }
   public set sampleCount(value: number) {
      if (this._sampleCount === value) return
      this._sampleCount = value
      if (this.device) {
         this.build2DPipeline()
         this.buildUniforms()
      }
      this.updateSampling(value)
   }

   public async init(canvas: HTMLCanvasElement) {
      if (!isBlink) throw new Error('Unsupported browser')

      if (!navigator.gpu) throw new Error('WebGPU is not supported on this browser.')
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: this.powerPreference })
      if (!adapter) throw new Error('WebGPU supported but disabled')
      this.device = await adapter.requestDevice()

      this.ctx = canvas.getContext('webgpu')
      this.mainFormat = navigator.gpu.getPreferredCanvasFormat()

      this.ctx.configure({
         device: this.device,
         format: this.mainFormat,
         alphaMode: 'premultiplied',
      })
      this.initScene()
      this.build2DPipeline()
      this.buildUniforms()
      this.render()
      return this
   }

   private initScene() {
      this.tight = new TightIndexedMeshGroup(this.device)
      this.piecewise = new PiecewiseIndexedMeshGroup(this.device)

      const viewPort = [this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, 10, this._zoom]
      const ubo = new Pool(this.device, new UBO_ARRAY(viewPort), GPUBufferUsage.UNIFORM)
      this.viewPortChunk = ubo.create(viewPort)
   }

   private buildUniforms() {
      this.uniformBindGroup = this.device.createBindGroup({
         layout: this.uniformBindGroupLayout,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: this.viewPortChunk.manager.buffer,
               },
            },
         ],
      })
   }

   private build2DPipeline() {
      this.shaderModule ??= this.device.createShaderModule({ code: SimpleShader })
      this.updateSampling()
      this.uniformBindGroupLayout = this.device.createBindGroupLayout({
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
      this.pipeline = this.device.createRenderPipeline({
         layout: this.device.createPipelineLayout({
            bindGroupLayouts: [this.uniformBindGroupLayout],
         }),
         vertex: {
            module: this.shaderModule,
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
               {
                  arrayStride: 4 * VBO_ARRAY.BYTES_PER_ELEMENT,
                  stepMode: 'instance',
                  attributes: [
                     {
                        format: 'float32x4',
                        offset: 0,
                        shaderLocation: 1,
                     },
                  ],
               },
            ],
         },
         fragment: {
            module: this.shaderModule,
            entryPoint: 'fragment',
            targets: [{ format: this.mainFormat }],
         },
         primitive: {
            topology: 'triangle-list',
         },
         multisample: {
            count: this._sampleCount,
         },
      })
   }

   public async printAdapterInfo(adapter: GPUAdapter) {
      console.log('Limits', adapter.limits)
      if (adapter.requestAdapterInfo) {
         const info = await adapter.requestAdapterInfo()
         // @ts-ignore
         console.log(info.description, '|', info.driver, '|', this.powerPreference)
      }
   }

   public updateSampling(sampleCount: number = this._sampleCount) {
      this._sampleCount = sampleCount
      if (sampleCount === 1) {
         this.attachment.view = undefined
         this.attachment.resolveTarget = undefined
         return
      }
      const texture = this.device.createTexture({
         size: [this.ctx.canvas.width * this.pxRatio, this.ctx.canvas.height * this.pxRatio],
         sampleCount,
         format: this.mainFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
      })
      this.attachment.view = texture.createView()
   }

   public render() {
      const commandEncoder = this.device.createCommandEncoder()

      const view = this.ctx.getCurrentTexture().createView()
      if (this._sampleCount > 1) this.attachment.resolveTarget = view
      else this.attachment.view = view

      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.attachment],
      })
      pass.setBindGroup(0, this.uniformBindGroup)
      pass.setPipeline(this.pipeline)
      this.piecewise.recordRenderPass(pass)
      this.tight.recordRenderPass(pass)
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])
   }
}