import { DynamicMeshGroup, StaticMeshGroup } from './mesh'
import { ELEMENT_PER_VERTEX, ELEMENT_PER_VERTEX_POS, UBO_ARRAY, VBO_ARRAY } from './constants'
import TriangleShader from './triangle.wgsl?raw'
import { aquireGPUDevice, createBufferFromArray } from './utils'

// TODO: split to scene and renderer
export class WebGPURenderer {
   // scene
   public static: StaticMeshGroup
   public dynamic: DynamicMeshGroup
   private viewportBuffer: GPUBuffer
   private shaderModule: GPUShaderModule

   // target
   private ctx: GPUCanvasContext
   private device: GPUDevice
   private mainFormat: GPUTextureFormat
   private pxRatio = window.devicePixelRatio | 1

   // settings
   private powerPreference: GPURequestAdapterOptions['powerPreference'] = 'low-power'
   private _sampleCount = 1
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

   public get objects() {
      const s = this.static.objects.values()
      const d = this.dynamic.objects.values()
      return Array.from(s).concat(Array.from(d))
   }
   public get zoom() {
      return this._zoom
   }
   public set zoom(value: number) {
      if (this._zoom === value) return

      this._zoom = value
      this.device.queue.writeBuffer(
         this.viewportBuffer,
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
         this.buildPipeline()
         this.buildUniforms()
      }
      this.updateSampling(value)
   }

   public async init(canvas: HTMLCanvasElement) {
      const { device, adapter } = await aquireGPUDevice({ powerPreference: this.powerPreference })
      this.printAdapterInfo(adapter)
      this.device = device
      this.mainFormat = navigator.gpu.getPreferredCanvasFormat()
      this.ctx = canvas.getContext('webgpu')
      this.ctx.configure({
         device: this.device,
         format: this.mainFormat,
         alphaMode: 'premultiplied',
      })
      this.initScene()

      this.buildPipeline()
      this.buildUniforms()
      this.render()
      return this
   }

   private initScene() {
      this.static = new StaticMeshGroup(this.device)
      this.dynamic = new DynamicMeshGroup(this.device)

      const viewPort = [this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, 10, this._zoom]
      this.viewportBuffer = createBufferFromArray(
         this.device,
         new UBO_ARRAY(viewPort),
         GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      )
   }

   private buildUniforms() {
      this.uniformBindGroup = this.device.createBindGroup({
         layout: this.pipeline.getBindGroupLayout(0),
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: this.viewportBuffer,
               },
            },
         ],
      })
   }

   private buildPipeline() {
      this.shaderModule ??= this.device.createShaderModule({ code: TriangleShader })
      this.updateSampling()
      this.pipeline = this.device.createRenderPipeline({
         layout: this.device.createPipelineLayout({
            bindGroupLayouts: [
               this.device.createBindGroupLayout({
                  entries: [
                     {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                           type: 'uniform',
                        },
                     },
                  ],
               }),
            ],
         }),
         vertex: {
            module: this.shaderModule,
            entryPoint: 'vertex',
            buffers: [
               {
                  arrayStride: ELEMENT_PER_VERTEX * VBO_ARRAY.BYTES_PER_ELEMENT,
                  attributes: [
                     { format: 'float32x2', offset: 0, shaderLocation: 0 },
                     {
                        format: 'float32x4',
                        offset: ELEMENT_PER_VERTEX_POS * VBO_ARRAY.BYTES_PER_ELEMENT,
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
      const info = await adapter.requestAdapterInfo()
      // @ts-ignore
      console.log(info.description, '|', info.driver, '|', this.powerPreference)
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
      this.dynamic.recordRenderPass(pass)
      this.static.recordRenderPass(pass)
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])
   }
}
