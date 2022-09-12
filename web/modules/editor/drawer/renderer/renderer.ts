import { Point2DTupleView } from '../../types'
import { DynamicMeshGroup, MeshGroup } from './chunk_system/mesh'
import { ELEMENT_PER_VERTEX, ELEMENT_PER_VERTEX_POS, UBO_ARRAY, VBO_ARRAY } from './constants'
import TriangleShader from './triangle.wgsl?raw'
import { TypedArray } from './types'
import { aquireGPU, createBufferFromArray } from './utils'

export class WebGPURenderer {
   canvasHalfWidth: number
   canvasHalfHeight: number
   private ctx: GPUCanvasContext
   private device: GPUDevice
   private viewportUniformBuffer: GPUBuffer
   private uniformBindGroup: GPUBindGroup
   private pipeline: GPURenderPipeline
   readonly clearValue: GPUColor = [0, 0, 0, 0]
   sMem: MeshGroup
   dMem: DynamicMeshGroup
   basicColorAttachment: GPURenderPassColorAttachment = {
      loadOp: 'clear',
      clearValue: this.clearValue,
      storeOp: 'store',
      view: null,
   }
   async init(canvas: HTMLCanvasElement) {
      this.canvasHalfWidth = canvas.width / 2
      this.canvasHalfHeight = canvas.height / 2

      const { device } = await aquireGPU({ powerPreference: 'low-power' })
      this.device = device

      const textureFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat()
      this.ctx = canvas.getContext('webgpu')
      this.ctx.configure({
         device: this.device,
         format: textureFormat,
         alphaMode: 'premultiplied',
      })

      const shaderModule = device.createShaderModule({ code: TriangleShader })

      this.sMem = new MeshGroup(this.device)
      this.dMem = new DynamicMeshGroup(this.device)

      this.viewportUniformBuffer = createBufferFromArray(
         this.device,
         new UBO_ARRAY([this.canvasHalfWidth, this.canvasHalfHeight, 10, 1]),
         GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      )
      const uniformBGL = this.device.createBindGroupLayout({
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
      this.uniformBindGroup = this.device.createBindGroup({
         layout: uniformBGL,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: this.viewportUniformBuffer,
               },
            },
         ],
      })
      this.pipeline = this.device.createRenderPipeline({
         layout: this.device.createPipelineLayout({
            bindGroupLayouts: [uniformBGL],
         }),
         vertex: {
            module: shaderModule,
            entryPoint: 'vertex',
            buffers: [
               {
                  arrayStride: ELEMENT_PER_VERTEX * VBO_ARRAY.BYTES_PER_ELEMENT,
                  attributes: [
                     // pos X Y
                     { format: 'float32x2', offset: 0, shaderLocation: 0 },
                     // color rgba
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
            module: shaderModule,
            entryPoint: 'fragment',
            targets: [{ format: textureFormat }],
         },
         primitive: {
            topology: 'triangle-list',
         },
         multisample: {
            // https://github.com/gpuweb/gpuweb/pull/932#issuecomment-892819099
            count: 1,
         },
      })
      // clear screen
      this.render()
   }
   writeUBO(data: TypedArray) {
      this.device.queue.writeBuffer(this.viewportUniformBuffer, 0, data)
   }
   render() {
      const commandEncoder = this.device.createCommandEncoder()
      this.basicColorAttachment.view = this.ctx.getCurrentTexture().createView()
      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.basicColorAttachment],
      })
      pass.setPipeline(this.pipeline)
      pass.setBindGroup(0, this.uniformBindGroup)
      this.sMem.setRenderCommands(pass)
      this.dMem.setRenderCommands(pass)
      pass.end()
      this.device.queue.submit([commandEncoder.finish()])
   }
   canvasCoordsToWebgpu(p: Point2DTupleView) {
      p[0] = p[0] - this.canvasHalfWidth
      p[1] = -p[1] + this.canvasHalfHeight
      return p
   }
   dispose() {
      // this.dMem.dispose()
      // this.dMem = null

      // this.sMem.dispose()
      // this.sMem = null

      // this.viewportUniformBuffer?.destroy()
      // this.viewportUniformBuffer = null
      // this.device?.destroy()
      // this.device = null
      // console.log('Disposed!')
   }
}
