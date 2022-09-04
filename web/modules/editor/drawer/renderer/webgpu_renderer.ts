import { Point } from '../../types'
import TriangleShader from './triangle.wgsl?raw'
import { LineStyle, TypedArray } from './types'
import { aquireGPU, compileShader, computeLineMesh, createBufferFromArray, defaultLineStyle } from './utils'

export type LineSkeleton = {
   points: number[]
   style: LineStyle
}

class Drawing implements LineSkeleton {
   points: number[] = []
   style: LineStyle = structuredClone(defaultLineStyle)
   readonly renderer: WebGPURenderer
   vOffset: number
   vLength: number
   iOffset: number
   iLength: number
   constructor(renderer: WebGPURenderer, { vOffset, vLength, iOffset, iLength }) {
      this.renderer = renderer
      this.vOffset = vOffset
      this.vLength = vLength
      this.iOffset = iOffset
      this.iLength = iLength
   }
   public continue(point: Point) {
      this.points.push(...point)

      const mesh = computeLineMesh(this.points, this.style)
      // console.log(mesh);

      const { vOffset, vLength, iOffset, iLength } = this

      if (mesh.vertices.length > vLength) {
         this.points.pop()
         this.points.pop()
         return
      }

      this.renderer.mem.VBO.set(mesh.vertices, vOffset)
      this.renderer.queue.writeBuffer(
         this.renderer.mem.vboBuffer,
         vOffset * VBO_ARRAY.BYTES_PER_ELEMENT,
         this.renderer.mem.VBO.slice(vOffset, vOffset + vLength)
      )

      this.renderer.mem.IBO.set(mesh.indices, iOffset)
      this.renderer.queue.writeBuffer(
         this.renderer.mem.iboBuffer,
         iOffset * IBO_ARRAY.BYTES_PER_ELEMENT,
         this.renderer.mem.IBO.slice(iOffset, iOffset + iLength)
      )
      this.renderer.render(this.renderer.mem)
   }
}
export type IDrawing = InstanceType<typeof Drawing>

const VBO_ARRAY = Float32Array
const IBO_ARRAY = Uint32Array
const INDEX_FORMAT: GPUIndexFormat = 'uint32'

type RenderMemoryGroup = {
   VBO: TypedArray
   IBO: TypedArray
   vboBuffer: GPUBuffer
   iboBuffer: GPUBuffer
}

// class MeshBuffer {
//    vbo: TypedArray
//    vboBuffer: GPUBuffer

//    constructor() {}

//    realloc(lenghtToAdd) {

//       const newIBO = new IBO_ARRAY(this.mem.IBO.length + DRAW_VBO_CHUNK_LENGTH)
//       newIBO.set(this.mem.IBO)
//       this.mem.IBO = newIBO
//       this.vbo = new
//    }
// }

export class WebGPURenderer {
   private readonly drawings: Drawing[] = []

   public readonly VBO_CHUNK_LENGTH = 2 ** 12
   public readonly IBO_CHUNK_LENGTH = 2 ** 12

   private readonly VBO_USAGE = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   private readonly IBO_USAGE = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST

   private canvas_width_half: number
   private canvas_height_half: number

   private ctx: GPUCanvasContext
   private device: GPUDevice
   private viewport_uniform_buffer: GPUBuffer
   private uniform_bind_group: GPUBindGroup
   private pipeline: GPURenderPipeline

   public queue: GPUQueue

   mem: RenderMemoryGroup = {
      VBO: new VBO_ARRAY(),
      IBO: new IBO_ARRAY(),
      vboBuffer: null as GPUBuffer,
      iboBuffer: null as GPUBuffer,
   }

   public readonly clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

   basicColorAttachment: GPURenderPassColorAttachment = {
      loadOp: 'clear',
      clearValue: this.clearValue,
      storeOp: 'store',
      // @ts-ignore FF
      loadValue: this.clearValue,
   }

   public async init(canvas: HTMLCanvasElement) {
      this.canvas_width_half = canvas.width / 2
      this.canvas_height_half = canvas.height / 2

      this.ctx = canvas.getContext('webgpu')
      const { device, adapter } = await aquireGPU({ powerPreference: 'high-performance' })
      if (import.meta.env.DEV) {
         // @ts-ignore DEV
         window.deviceLimits = device.limits
      }
      this.device = device
      this.queue = device.queue
      let textureFormat: GPUTextureFormat
      if ('getPreferredCanvasFormat' in navigator.gpu) {
         textureFormat = navigator.gpu.getPreferredCanvasFormat()
      } else {
         // @ts-ignore FF https://bugzilla.mozilla.org/show_bug.cgi?id=1785576
         textureFormat = this.ctx.getPreferredFormat(adapter)
      }
      this.ctx.configure({
         device: this.device,
         format: textureFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
         alphaMode: 'opaque',
      })
      const shaderModule = await compileShader(this.device, TriangleShader)

      this.viewport_uniform_buffer = createBufferFromArray(
         this.device,
         VBO_ARRAY.from([this.canvas_width_half, this.canvas_height_half, 10, 1]),
         GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      )

      const uniformBGL = this.device.createBindGroupLayout({
         entries: [
            {
               binding: 0,
               visibility: GPUShaderStage.VERTEX,
               buffer: {
                  type: 'uniform',
                  hasDynamicOffset: false,
               },
            },
         ],
      })

      this.uniform_bind_group = this.device.createBindGroup({
         layout: uniformBGL,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: this.viewport_uniform_buffer,
               },
            },
         ],
      })

      this.pipeline = await this.device.createRenderPipelineAsync({
         layout: this.device.createPipelineLayout({
            bindGroupLayouts: [uniformBGL],
         }),
         vertex: {
            module: shaderModule,
            entryPoint: 'vertex',
            buffers: [
               {
                  // float32 is 4 bytes
                  // float32x4 is 4 numbers for 4 bytes = 4 * 4
                  // we have 2 atributes, so arrayStride will be sum of all offsets: 4 * 4 + 4 * 4 = 2 * 4 * 4
                  arrayStride: 2 * 4 * VBO_ARRAY.BYTES_PER_ELEMENT,
                  attributes: [
                     { format: 'float32x4', offset: 0, shaderLocation: 0 },
                     {
                        format: 'float32x4',
                        offset: 4 * VBO_ARRAY.BYTES_PER_ELEMENT,
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
      this.render(null)

      this.log('Inited')
   }

   public createDrawing(start: [number, number]) {
      const lastDrawing = this.drawings.at(-1)

      const vOffset = lastDrawing ? lastDrawing.vOffset + lastDrawing.vLength : 0
      const vLength = this.VBO_CHUNK_LENGTH

      const iOffset = lastDrawing ? lastDrawing.iOffset + lastDrawing.iLength : 0
      const iLength = this.IBO_CHUNK_LENGTH

      this.alloc_item()

      const drawing = new Drawing(this, { vOffset, vLength, iOffset, iLength })
      drawing.points.push(...start)
      this.drawings.push(drawing)
      return drawing
   }

   private log(...msg) {
      console.log('[WebGPURenderer]', ...msg)
   }

private alloc_item(times = 1) {
   console.time('alloc')
   const newVBO = new VBO_ARRAY(this.mem.VBO.length + this.VBO_CHUNK_LENGTH * times)
   newVBO.set(this.mem.VBO)
   this.mem.VBO = newVBO
   this.mem.vboBuffer = createBufferFromArray(this.device, this.mem.VBO, this.VBO_USAGE)

   const newIBO = new IBO_ARRAY(this.mem.IBO.length + this.IBO_CHUNK_LENGTH * times)
   newIBO.set(this.mem.IBO)
   this.mem.IBO = newIBO
   this.mem.iboBuffer = createBufferFromArray(this.device, this.mem.IBO, this.IBO_USAGE)
   console.timeEnd('alloc')
}

   public render(memGroup: RenderMemoryGroup | null) {
      const start = performance.now()
      const commandEncoder = this.device.createCommandEncoder()

      this.basicColorAttachment.view = this.ctx.getCurrentTexture().createView()
      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.basicColorAttachment],
      })

      pass.setPipeline(this.pipeline)
      pass.setBindGroup(0, this.uniform_bind_group)
      if (memGroup !== null) {
         pass.setVertexBuffer(0, memGroup.vboBuffer)
         pass.setIndexBuffer(memGroup.iboBuffer, INDEX_FORMAT)
         pass.drawIndexed(memGroup.IBO.length, 1)
      }
      'end' in pass ? pass.end() : pass.endPass()
      this.device.queue.submit([commandEncoder.finish()])
      // @ts-ignore DEV
      window.staticFrameTime = performance.now() - start
   }

   public canvas_coords_to_webgpu(p: Point) {
      p[0] = p[0] - this.canvas_width_half
      p[1] = -p[1] + this.canvas_height_half
      return p
   }

   public dispose() {
      this.mem.vboBuffer?.destroy()
      this.mem.iboBuffer?.destroy()
      this.viewport_uniform_buffer?.destroy()
      this.device?.destroy()
   }
}
