import { Point } from '../../types'
import TriangleShader from './triangle.wgsl?raw'
import { LineStyle, TypedArray } from './types'
import { aquireGPU, compileShader, computeLineMesh, createBufferFromArray, defaultLineStyle } from './utils'

export type IDrawing = InstanceType<typeof Drawing>

const VBO_ARRAY = Float32Array
const IBO_ARRAY = Uint16Array

const ELEMENTS_PER_VERTEX = 2 + 4 // x y + color
const INDEX_FORMAT: GPUIndexFormat = 'uint16'
const VBO_CHUNK_LENGTH = 55 * ELEMENTS_PER_VERTEX ** 3
const IBO_CHUNK_LENGTH = 55 * ELEMENTS_PER_VERTEX ** 3

export type LineSkeleton = {
   points: number[]
   style: LineStyle
}

class Drawing implements LineSkeleton {
   points: number[] = []
   style: LineStyle = structuredClone(defaultLineStyle)
   vOffset: number
   vLength: number
   iOffset: number
   iLength: number
   vertIndexToStartFrom: number

   readonly renderer: WebGPURenderer
   constructor(renderer: WebGPURenderer, { vOffset, vLength, iOffset, iLength, indexToStartFrom }) {
      this.renderer = renderer
      this.vOffset = vOffset
      this.vLength = vLength
      this.iOffset = iOffset
      this.iLength = iLength
      this.vertIndexToStartFrom = indexToStartFrom
   }
   public continue(point: Point) {
      const from = this.points.slice(-2)
      this.points.push(...point)

      const mesh = computeLineMesh([...from, ...point], this.style)

      const { vOffset, vLength, iOffset, iLength } = this

      const vbo = []

      for (let i = 1; i < mesh.verts.length; i += 2) {
         vbo.push(mesh.verts[i - 1], mesh.verts[i], ...this.style.color)
      }
      const ibo = mesh.indices.map((i) => i + this.vertIndexToStartFrom)
      if (vbo.length > VBO_CHUNK_LENGTH || ibo.length > IBO_CHUNK_LENGTH) {
         this.points.pop()
         this.points.pop()
         return false
      }

      this.renderer.mem.VBO.set(vbo, vOffset)
      this.renderer.queue.writeBuffer(
         this.renderer.mem.vboBuffer,
         vOffset * VBO_ARRAY.BYTES_PER_ELEMENT,
         this.renderer.mem.VBO.slice(vOffset, vOffset + vLength)
      )

      this.renderer.mem.IBO.set(ibo, iOffset)
      this.renderer.queue.writeBuffer(
         this.renderer.mem.iboBuffer,
         iOffset * IBO_ARRAY.BYTES_PER_ELEMENT,
         this.renderer.mem.IBO.slice(iOffset, iOffset + iLength)
      )

      this.renderer.render(this.renderer.mem)
      return true
   }
}

type RenderMemoryGroup = {
   VBO: TypedArray
   IBO: TypedArray
   vboBuffer: GPUBuffer
   iboBuffer: GPUBuffer
}

export class WebGPURenderer {
   private readonly drawings: Drawing[] = []

   private readonly VBO_USAGE = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   private readonly IBO_USAGE = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST

   private canvas_width_half: number
   private canvas_height_half: number

   private ctx: GPUCanvasContext
   private device: GPUDevice
   public viewport_uniform_buffer: GPUBuffer
   private uniform_bind_group: GPUBindGroup
   private pipeline: GPURenderPipeline
   private stats: Stats | null

   public queue: GPUQueue
   public readonly clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

   mem: RenderMemoryGroup = {
      VBO: new VBO_ARRAY(),
      IBO: new IBO_ARRAY(),
      vboBuffer: null as GPUBuffer,
      iboBuffer: null as GPUBuffer,
   }

   basicColorAttachment: GPURenderPassColorAttachment = {
      loadOp: 'clear',
      clearValue: this.clearValue,
      storeOp: 'store',
      // @ts-ignore FF
      loadValue: this.clearValue,
   }

   public async init(canvas: HTMLCanvasElement, stats?: Stats) {
      this.canvas_width_half = canvas.width / 2
      this.canvas_height_half = canvas.height / 2
      this.stats = stats

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
                  arrayStride: 2 * VBO_ARRAY.BYTES_PER_ELEMENT + 4 * VBO_ARRAY.BYTES_PER_ELEMENT,
                  attributes: [
                     // pos X Y
                     { format: 'float32x2', offset: 0, shaderLocation: 0 },
                     // color rgba
                     {
                        format: 'float32x4',
                        offset: 2 * VBO_ARRAY.BYTES_PER_ELEMENT,
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
      this.alloc_item()
      const lastDrawing = this.drawings.at(-1)

      const vLength = VBO_CHUNK_LENGTH
      const iLength = IBO_CHUNK_LENGTH

      let vOffset = 0
      let iOffset = 0

      let indexToStartFrom = 0

      if (lastDrawing) {
         vOffset = lastDrawing.vOffset + lastDrawing.vLength
         iOffset = lastDrawing.iOffset + lastDrawing.iLength
         indexToStartFrom = (this.drawings.length * VBO_CHUNK_LENGTH) / ELEMENTS_PER_VERTEX
      }

      const drawing = new Drawing(this, { vOffset, vLength, iOffset, iLength, indexToStartFrom })

      drawing.points.push(...start)

      this.drawings.push(drawing)
      return drawing
   }

   private log(...msg) {
      console.log('[WebGPURenderer]', ...msg)
   }

   private alloc_item(times = 1) {
      console.time('Alloc time')
      const newVBO = new VBO_ARRAY(this.mem.VBO.length + VBO_CHUNK_LENGTH * times)
      newVBO.set(this.mem.VBO)
      this.mem.VBO = newVBO
      this.mem.vboBuffer = createBufferFromArray(this.device, this.mem.VBO, this.VBO_USAGE)

      const newIBO = new IBO_ARRAY(this.mem.IBO.length + IBO_CHUNK_LENGTH * times)
      newIBO.set(this.mem.IBO)
      this.mem.IBO = newIBO

      this.mem.iboBuffer = createBufferFromArray(this.device, this.mem.IBO, this.IBO_USAGE)
      console.timeEnd('Alloc time')

      // this.stats?.vbo.update(this.mem.VBO.byteLength / 1024, 256 * 1024)
      // this.stats?.ibo.update(this.mem.IBO.byteLength / 1024, 256 * 1024)
      // console.log('VBO:', this.mem.VBO.byteLength, 'bytes', 'IBO:', this.mem.IBO.byteLength, 'bytes')
   }

   // public writeBuffers() {
   //    // const vbo = this.drawings.flatMap((d) => d.vbo)
   //    // const ibo =  this.drawings.flatMap((d) => d.ibo)

   //    // prettier-ignore
   //    const cube1vbo = [
   //       0, 0,   1, 1, 1, 1,
   //       0, 10,  1, 1, 1, 1,
   //       10, 10, 1, 1, 1, 1,
   //       10, 0,  1, 1, 1, 1,
   //    ]
   //    // prettier-ignore
   //    const cube2vbo = [
   //       20, 0,  1, 0.5, 1, 1,
   //       20, 10, 1, 0.5, 0.5, 1,
   //       30, 10, 1, 0.5, 1, 1,
   //       30, 0,  1, 1, 0.5, 1,
   //    ]

   //    const cubeibo = [0, 1, 3, 1, 2, 3]
   //    const pad = new Array(12).fill(0)

   //    const lastIndex = Math.max(...cubeibo)
   //    const vbo: number[] = [...cube1vbo, ...pad, ...cube2vbo]
   //    const ibo: number[] = [...cubeibo, ...cubeibo.map((i) => i + lastIndex + 1 + pad.length / 6)]

   //    this.mem.VBO = new VBO_ARRAY(vbo)
   //    this.mem.IBO = new IBO_ARRAY(ibo)
   //    this.mem.vboBuffer = createBufferFromArray(this.device, this.mem.VBO, this.VBO_USAGE)
   //    this.mem.iboBuffer = createBufferFromArray(this.device, this.mem.IBO, this.IBO_USAGE)
   // }

   public render(memGroup: RenderMemoryGroup | null = this.mem) {
      // const start = performance.now()
      // this.stats?.begin()
      const commandEncoder = this.device.createCommandEncoder()

      this.basicColorAttachment.view = this.ctx.getCurrentTexture().createView()
      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [this.basicColorAttachment],
      })

      pass.setPipeline(this.pipeline)
      pass.setBindGroup(0, this.uniform_bind_group)
      if (memGroup) {
         pass.setIndexBuffer(memGroup.iboBuffer, INDEX_FORMAT)
         pass.setVertexBuffer(0, memGroup.vboBuffer)
         pass.drawIndexed(memGroup.IBO.length)
      }
      'end' in pass ? pass.end() : pass.endPass()
      this.device.queue.submit([commandEncoder.finish()])
      // this.stats?.end()

      // @ts-ignore DEV
      // window.staticFrameTime = performance.now() - start
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
