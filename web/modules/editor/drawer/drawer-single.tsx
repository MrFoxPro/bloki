import { createComputed, createEffect, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { BlokiGPU } from '@/lib/gpu'
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
}

export function DrawerSinglePipeline() {
   let canvasRef: HTMLCanvasElement
   let device: GPUDevice
   let ctx: GPUCanvasContext
   let canvasWidthHalf: number
   let canvasHeightHalf: number

   let vBuffer: GPUBuffer
   let iBuffer: GPUBuffer
   let viewPortUniformBuffer: GPUBuffer
   let uniformBindGroup: GPUBindGroup
   let pipeline: GPURenderPipeline

   const VBOUsage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   const IBOUsage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST

   GPUBufferUsage.STORAGE
   let vboSource: number[] = []
   let iboSource: number[] = []

   let lastVBOSize = 0
   let lastIBOSize = 0

   let isMouseDown = false

   // const { editor, toAbs } = useEditorContext()

   // const [store, setStore] = createStore({
   //    points: [-85, 70, 5, 70, -25, 58],
   // })

   function computeLineMesh(points: number[], style = defaultLineStyle) {
      const data = {
         shape: {
            closeStroke: false,
            type: SHAPES.POLY,
         },
         points,
         lineStyle: style,
      }
      const geometry: Mesh = {
         closePointEps: 1e-4,
         verts: [] as number[],
         indices: [] as number[],
      }
      buildNonNativeLine(data, geometry)
      return geometry
   }

   function meshToVBOArray(line: Mesh, style: LineStyle) {
      const vbo: number[] = []
      for (let i = 1; i < line.verts.length; i += 2) {
         vbo.push(line.verts[i - 1], line.verts[i], 0, 1, ...style.color)
      }
      return vbo
   }

   function meshToIBOArray(line: Mesh) {
      return line.indices
   }

   function resetBuffers() {
      vBuffer.destroy()
      const vbo = new Float32Array(vboSource)
      lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      vBuffer = BlokiGPU.createBufferFromArray(device, vbo, VBOUsage, lastVBOSize)

      iBuffer.destroy()
      const ibo = new Uint32Array(iboSource)
      lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)
      iBuffer = BlokiGPU.createBufferFromArray(device, ibo, IBOUsage, lastIBOSize)
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

      // computeMesh()

      // const vbo = new Float32Array(vboSource)
      // const ibo = new Uint32Array(iboSource)

      // lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      // lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)

      vBuffer = BlokiGPU.createBufferFromArray(device, new Float32Array(2 ** 14), VBOUsage)
      iBuffer = BlokiGPU.createBufferFromArray(device, new Float32Array(2 ** 14 * 3), IBOUsage)

      viewPortUniformBuffer = BlokiGPU.createBufferFromArray(
         device,
         Float32Array.from([canvasRef.width / 2, canvasRef.height / 2, 10, 1]),
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
      pass.drawIndexed(iboSource.length, 1)
      if ('end' in pass) pass.end()
      // @ts-ignore Firefox
      else pass.endPass()
      const commands = commandEncoder.finish()
      device.queue.submit([commands])
      window.frameTime = performance.now() - start
   }

   // createComputed(computeMesh)

   onMount(() => {
      canvasWidthHalf = canvasRef.width / 2
      canvasHeightHalf = canvasRef.height / 2

      initRenderer().then(frame)
   })

   onCleanup(() => {
      setTimeout(() => {
         vBuffer?.destroy()
         iBuffer?.destroy()
         viewPortUniformBuffer?.destroy()
         device?.destroy()
         console.log('Cleared')
      })
   })

   type PaintData = {
      id: number
      vboLoc: [start: number, length: number]
      iboLoc: [start: number, length: number]
      lineStyle: LineStyle
      // x y, x y ...
      points: number[]
   }

   const paintings = []
   let currentPainting: PaintData | null = null

   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      isMouseDown = true

      currentPainting = {
         id: paintings.length,
         vboLoc: [0, 0],
         iboLoc: [0, 0],
         lineStyle: {
            ...defaultLineStyle,
         },
         points: [-85, 70, 5, 70, -25, 58],
      }
      paintings.push(currentPainting)
   }

   function onPointerMove(e: PointerEvent) {
      if (!isMouseDown) return

      const gpuX = e.offsetX - canvasWidthHalf
      const gpuY = -e.offsetY + canvasHeightHalf
      currentPainting.points.push(gpuX, gpuY)

      const lineMesh = computeLineMesh(currentPainting.points, currentPainting.lineStyle)

      const VBOSlice = new Float32Array(meshToVBOArray(lineMesh, currentPainting.lineStyle))
      currentPainting.vboLoc[1] = VBOSlice.length
      const vboWriteOffset = Float32Array.BYTES_PER_ELEMENT * currentPainting.vboLoc[0]
      device.queue.writeBuffer(vBuffer, vboWriteOffset, VBOSlice)

      // lastVBOSize =

      const IBOSlice = new Uint32Array(meshToIBOArray(lineMesh))
      currentPainting.iboLoc[1] = IBOSlice.length
      const iboWriteOffset = Uint32Array.BYTES_PER_ELEMENT * currentPainting.iboLoc[0]
      device.queue.writeBuffer(iBuffer, iboWriteOffset, IBOSlice)

      iboSource = IBOSlice
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
      // setStore('points', [])
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
