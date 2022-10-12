import { isBlink } from '@solid-primitives/platform'
import { PipelineAgent } from './pipelines/pipeline_agent'

// TODO: split to scene and renderer
export class WebGPURenderer {
   // target
   private ctx: GPUCanvasContext
   public device: GPUDevice
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
   public readonly pipelines: PipelineAgent<any>[] = []

   public get inited() {
      return !!this.device
   }
   public get sampleCount() {
      return this._sampleCount
   }
   public set sampleCount(value: number) {
      if (this._sampleCount === value) return
      this._sampleCount = value
      if (this.inited) {
         this.buildPipelines()
      }
      this.updateSampling(value)
   }

   public async init(canvas: HTMLCanvasElement) {
      if (!isBlink) throw new Error('Unsupported browser')
      if (!navigator.gpu) throw new Error('WebGPU is not supported on this browser.')
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: this.powerPreference })
      if (!adapter) throw new Error('WebGPU supported but disabled')
      this.device = await adapter.requestDevice({ requiredFeatures: ['indirect-first-instance'] })

      if (import.meta.env.DEV) this.printAdapterInfo(adapter)

      this.ctx = canvas.getContext('webgpu')
      this.mainFormat = navigator.gpu.getPreferredCanvasFormat()

      this.ctx.configure({
         device: this.device,
         format: this.mainFormat,
         alphaMode: 'premultiplied',
      })
      this.buildPipelines()
      this.render()
      return this
   }

   private buildPipelines() {
      this.updateSampling()
      for (const pipeline of this.pipelines) {
         pipeline.build()
      }
   }

   public async printAdapterInfo(adapter: GPUAdapter) {
      console.log('Limits', adapter.limits, 'features', [...adapter.features])
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
      for (const pipeline of this.pipelines) {
         pipeline.recordRenderPass(pass)
      }
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])
   }
}
