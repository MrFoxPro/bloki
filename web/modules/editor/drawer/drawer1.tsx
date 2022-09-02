import { createComputed, createEffect, on, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { BlokiGPU, TypedArray, TypedArrayConstructor } from '@/lib/gpu'
import { Transform, Point } from '../types'
// import { useEditorContext } from '../toolbox/editor.store'
import triangleShader from './triangle.wgsl?raw'
import { buildNonNativeLine, LINE_CAP, LINE_JOIN, SHAPES } from './line'

console.clear()
type Figure = {
   bound: Transform
   points: Point[]
}

const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

type LineStyle = {
   width: number
   miterLimit: number
   alignment: number
   cap: LINE_CAP
   join: LINE_JOIN
   color: [r: number, g: number, b: number, a: number]
}

const defaultLineStyle: LineStyle = {
   width: 3,
   miterLimit: 0.01,
   alignment: 0.01,
   cap: LINE_CAP.ROUND,
   join: LINE_JOIN.ROUND,
   color: [0.5, 1, 0.5, 1],
}

type Mesh = {
   verts: number[]
   indices: number[]
   closePointEps?: number
   style: LineStyle
}

const IBOType = 'uint32'

export function DrawerSinglePipeline() {
   let canvasRef: HTMLCanvasElement
   let device: GPUDevice
   let ctx: GPUCanvasContext
   let canvasWidthHalf: number
   let canvasHeightHalf: number

   let viewPortUniformBuffer: GPUBuffer
   let uniformBindGroup: GPUBindGroup
   let pipeline: GPURenderPipeline

   type BufferInfo = {
      totalLength: number
      filledLength: number
      buffer: GPUBuffer
      usage: GPUBufferUsageFlags
      CHUNK_LENGTH: number
      Array: TypedArrayConstructor
      type: 'vbo' | 'ibo'
   }

   const buffers: [BufferInfo, BufferInfo] = [
      {
         type: 'vbo',
         totalLength: 0,
         filledLength: 0,
         buffer: null,
         usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
         CHUNK_LENGTH: 2048,
         Array: Float32Array,
      },
      {
         type: 'ibo',
         totalLength: 0,
         filledLength: 0,
         buffer: null,
         usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
         CHUNK_LENGTH: 2048 * 3,
         Array: Uint32Array,
      },
   ]

   let isMouseDown = false

   // sync
   type Painting = {
      id: number
      points: number[]
      style: LineStyle
   }

   const [store, setStore] = createStore({
      paintings: [] as Painting[],
   })

   createEffect(() => {
      if (!canvasRef) return
      canvasWidthHalf = canvasRef.width / 2
      canvasHeightHalf = canvasRef.height / 2
      initRenderer().then()
   })

   type PaintData = Painting & {
      vboOffset: number
      iboOffset: number
      lineStyle: LineStyle
      // x y, x y ...
      points: number[]
      ibo: number[]
      vbo: number[]
   }

   const renderData: PaintData[] = []
   let painting: PaintData | null = null

   async function addStaticPaintings(...paintingsToAdd: Painting[]) {
      let lastPaint = renderData.at(-1)

      for (const paint of paintingsToAdd) {
         const mesh = computeLineMesh(paint.points, paint.style)

         const pData: PaintData = paint

         pData.vbo = meshToVBO(mesh)

         pData.ibo = meshToIBO(mesh)

         if (lastPaint) {
            pData.vboOffset = lastPaint.vboOffset + lastPaint.vbo.length
            pData.iboOffset = lastPaint.iboOffset + lastPaint.ibo.length
         } else {
            pData.vboOffset = 0
            pData.iboOffset = 0
         }
         renderData.push(pData)

         lastPaint = pData
      }

      for (const bInfo of buffers) {
         const { Array, type, CHUNK_LENGTH, usage } = bInfo
         const bo = new Array(getFullBO(type))
         const allocSize = (bo.length + CHUNK_LENGTH) * Array.BYTES_PER_ELEMENT
         bInfo.buffer = BlokiGPU.createBufferFromArray(device, bo, usage, allocSize)
      }
   }

   function writePainting() {}
   function removePainting() {}

   function defragmentBuffers() {}

   function getFullBO(bo: 'ibo' | 'vbo') {
      const vbo: number[] = []
      for (const p of renderData) {
         vbo.push(...p[bo])
      }
      return vbo
   }

   onCleanup(() => {
      setTimeout(() => {
         buffers.forEach((b) => b.buffer?.destroy())
         viewPortUniformBuffer?.destroy()
         device?.destroy()
         console.log('Cleared')
      })
   })

   function computeLineMesh(points: number[], style = defaultLineStyle) {
      const geometry: Mesh = {
         closePointEps: 1e-4,
         verts: [] as number[],
         indices: [] as number[],
         style,
      }
      buildNonNativeLine(
         {
            shape: {
               closeStroke: false,
               type: SHAPES.POLY,
            },
            points,
            lineStyle: style,
         },
         geometry
      )
      return geometry
   }

   function meshToVBO(mesh: Mesh) {
      const vbo: number[] = []
      for (let i = 1; i < mesh.verts.length; i += 2) {
         vbo.push(mesh.verts[i - 1], mesh.verts[i], 0, 1, ...mesh.style.color)
      }
      return vbo
   }

   function meshToIBO(line: Mesh) {
      return line.indices
   }

   async function initRenderer() {
      const gpu = await BlokiGPU.aquireGPU({ powerPreference: 'high-performance' })
      device = gpu.device
      ctx = canvasRef.getContext('webgpu')

      let textureFormat: GPUTextureFormat
      if ('getPreferredCanvasFormat' in navigator.gpu) {
         textureFormat = navigator.gpu.getPreferredCanvasFormat()
      } else {
         // @ts-ignore FF https://bugzilla.mozilla.org/show_bug.cgi?id=1785576
         textureFormat = ctx.getPreferredFormat(gpu.adapter)
      }

      ctx.configure({
         device,
         format: textureFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
         alphaMode: 'opaque',
      })

      const shaderModule = await BlokiGPU.compileShader(device, triangleShader)

      // const vbo = new Float32Array(vboSource)
      // const ibo = new Uint32Array(iboSource)

      // lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      // lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)

      // vBuffer = BlokiGPU.createBufferFromArray(device, new Float32Array(2 ** 14), VBOUsage)
      // iBuffer = BlokiGPU.createBufferFromArray(device, new Float32Array(2 ** 14 * 3), IBOUsage)

      viewPortUniformBuffer = BlokiGPU.createBufferFromArray(
         device,
         Float32Array.from([canvasWidthHalf, canvasHeightHalf, 10, 1]),
         GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      )

      const uniformBGL = device.createBindGroupLayout({
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

      uniformBindGroup = device.createBindGroup({
         layout: uniformBGL,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: viewPortUniformBuffer,
               },
            },
         ],
      })

      pipeline = await device.createRenderPipelineAsync({
         layout: device.createPipelineLayout({
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
                  arrayStride: 2 * 4 * Float32Array.BYTES_PER_ELEMENT,
                  attributes: [
                     { format: 'float32x4', offset: 0, shaderLocation: 0 },
                     {
                        format: 'float32x4',
                        offset: 4 * Float32Array.BYTES_PER_ELEMENT,
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

      const commandEncoder = device.createCommandEncoder()

      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [
            {
               view: ctx.getCurrentTexture().createView(),
               loadOp: 'clear',
               clearValue,
               storeOp: 'store',
               // @ts-ignore FF
               loadValue: clearValue,
            },
         ],
      })
      pass.setPipeline(pipeline)
      'end' in pass ? pass.end() : pass.endPass()
      device.queue.submit([commandEncoder.finish()])

      console.log('Inited')
   }

   function frame() {
      const start = performance.now()
      const commandEncoder = device.createCommandEncoder()
      const pass = commandEncoder.beginRenderPass({
         colorAttachments: [
            {
               view: ctx.getCurrentTexture().createView(),
               loadOp: 'clear',
               clearValue,
               storeOp: 'store',
               // @ts-ignore FF
               loadValue: clearValue,
            },
         ],
      })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, uniformBindGroup)
      pass.setIndexBuffer(iBuffer, 'uint32')
      pass.setVertexBuffer(0, vBuffer)
      pass.drawIndexed(ibo.length, 1)
      'end' in pass ? pass.end() : pass.endPass()
      device.queue.submit([commandEncoder.finish()])

      // @ts-ignore DEV
      window.frameTime = performance.now() - start
   }

   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      isMouseDown = true

      painting = {
         id: renderData.length,
         vboLoc: [0, 0],
         iboLoc: [0, 0],
         lineStyle: {
            ...defaultLineStyle,
         },
         points: [],
      }
      renderData.push(painting)
   }

   function writeBuffers() {}

   function onPointerMove(e: PointerEvent) {
      if (!isMouseDown) return

      const gpuX = e.offsetX - canvasWidthHalf
      const gpuY = -e.offsetY + canvasHeightHalf
      painting.points.push(gpuX, gpuY)

      const lineMesh = computeLineMesh(painting.points, painting.lineStyle)

      const VBOSlice = meshToVBO(lineMesh, painting.lineStyle)
      painting.vboLoc[1] = VBOSlice.length
      const vboWriteOffset = Float32Array.BYTES_PER_ELEMENT * painting.vboLoc[0]

      vbo.splice(painting.vboLoc[0], 0, ...VBOSlice)

      device.queue.writeBuffer(vBuffer, vboWriteOffset, new Float32Array(VBOSlice), painting.vboLoc[0], VBOSlice.length)

      const IBOSlice = meshToIBO(lineMesh)
      painting.iboLoc[1] = IBOSlice.length
      const iboWriteOffset = Uint32Array.BYTES_PER_ELEMENT * painting.iboLoc[0]
      device.queue.writeBuffer(iBuffer, iboWriteOffset, new Uint32Array(IBOSlice))

      ibo.splice(0, 0, ...IBOSlice)
      // vboSource.splice(_currentPainting.vboLoc[0], 0, ...newVBOArr)
      // iboSource.splice(_currentPainting.iboLoc[0], 0, ...newIBOArr)

      // vBuffer.destroy()
      // const vbo = new Float32Array(vboSource)
      // lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      // vBuffer = BlokiGPU.createBufferFromArray(device, vbo, VBOUsage, lastVBOSize)

      // iBuffer.destroy()
      // const ibo = new Uint32Array(iboSource)
      // lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)
      // iBuffer = BlokiGPU.createBufferFromArray(device, ibo, IBOUsage, lastIBOSize)

      // resetBuffers()

      requestAnimationFrame(frame)
   }

   function onPointerUp() {
      isMouseDown = false
      console.log(renderData)
   }

   return (
      <div>
         <div>
            <canvas
               onPointerDown={onPointerDown}
               onPointerMove={onPointerMove}
               onPointerUp={onPointerUp}
               onPointerLeave={() => (isMouseDown = false)}
               ref={canvasRef}
               width="1000"
               height="800"
            />
         </div>
      </div>
   )
}
