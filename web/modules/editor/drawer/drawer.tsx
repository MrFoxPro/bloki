import './drawer.scss'
import { createComputed, createEffect, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import * as PIXI from 'pixi.js'
import { BlokiGPU } from '@/lib/gpu'
import { Transform, Point } from '../types'
import { useEditorContext } from '../toolbox/editor.store'
import triangleShader from './triangle.wgsl?raw'
import { buildNonNativeLine, LINE_CAP, LINE_JOIN, SHAPES } from './line'

type Figure = {
   bound: Transform
   points: Point[]
}

const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

const defaultLineStyle = {
   width: 2,
   miterLimit: 0.01,
   alignment: 0.01,
   cap: LINE_CAP.ROUND,
   join: LINE_JOIN.ROUND,
   color: [0.5, 1, 0.5, 1],
}

function computeLineMesh(points: number[], style = defaultLineStyle) {
   const data = {
      shape: {
         closeStroke: false,
         type: SHAPES.POLY,
      },
      points,
      lineStyle: style,
   }
   const geometry = {
      closePointEps: 1e-4,
      points: [] as number[],
      indices: [] as number[],
   }
   buildNonNativeLine(data, geometry)
   return geometry
}

export function Drawer() {
   let canvasRef: HTMLCanvasElement
   let pixiCanvasRef: HTMLCanvasElement
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

   let vboSource = []
   let iboSource = []

   let lastVBOSize = 0
   let lastIBOSize = 0

   let isMouseDown = false

   const paintings = [
      {
         id: 0,
         points: [] as number[],
         bounds: {},
         vboPtr: [0, 10],
         iboPtr: [0, 24],
      },
   ]

   // onMount(() => {
   //    const pix = new PIXI.Application({
   //       width: pixiCanvasRef.width,
   //       height: pixiCanvasRef.height,
   //       context: pixiCanvasRef.getContext('webgl2'),
   //    })

   //    const pixGraphics = new PIXI.Graphics()
   //    pixGraphics.lineStyle(2, 0xffffff, 1)
   //    pixGraphics.moveTo(0, 0)
   //    pixGraphics.lineTo(100, 200)
   //    pixGraphics.lineTo(200, 200)
   //    pix.stage.addChild(pixGraphics)

   //    let isMouseDown = false
   //    let lastPost = [0, 0]
   //    pixiCanvasRef.onpointerdown = (e) => {
   //       isMouseDown = true
   //       lastPost[0] = e.offsetX
   //       lastPost[1] = e.offsetY
   //    }
   //    pixiCanvasRef.onpointerup = () => {
   //       isMouseDown = false
   //    }

   //    pixiCanvasRef.onpointermove = (e) => {
   //       if (!isMouseDown) return
   //       pixGraphics.moveTo(lastPost[0], lastPost[1])
   //       pixGraphics.lineTo(e.offsetX, e.offsetY)
   //       lastPost[0] = e.offsetX
   //       lastPost[1] = e.offsetY
   //    }
   // })

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      points: [-85, 70, 5, 70, -25, 58],
   })

   function computeBuffers() {
      // const lastPoints = store.points.slice(-10)
      const line = computeLineMesh(store.points)

      let verts = []
      for (let i = 1; i < line.points.length; i += 2) {
         verts.push(line.points[i - 1], line.points[i])
         verts.push(0, 1)
         verts.push(...defaultLineStyle.color)
      }
      vboSource = verts
      iboSource = line.indices
      if (!vBuffer || !iBuffer) return

      const vbo = new Float32Array(vboSource)
      vBuffer.destroy()
      lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      vBuffer = BlokiGPU.createBufferFromArray(device, vbo, VBOUsage, lastVBOSize)

      const ibo = new Uint32Array(iboSource)
      iBuffer.destroy()
      lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)
      iBuffer = BlokiGPU.createBufferFromArray(device, ibo, IBOUsage, lastIBOSize)
   }

   async function initRenderer() {
      const gpu = await BlokiGPU.aquireGPU({ powerPreference: 'low-power' })
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

      computeBuffers()

      const vbo = new Float32Array(vboSource)
      const ibo = new Uint32Array(iboSource)

      lastVBOSize = BlokiGPU.getTypedArrayAlignedSize(vbo)
      lastIBOSize = BlokiGPU.getTypedArrayAlignedSize(ibo)

      vBuffer = BlokiGPU.createBufferFromArray(device, vbo, VBOUsage, lastVBOSize)
      iBuffer = BlokiGPU.createBufferFromArray(device, ibo, IBOUsage, lastIBOSize)

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

      requestAnimationFrame(frame)
   }

   function frame() {
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
      else pass.endPass()

      const commands = commandEncoder.finish()
      device.queue.submit([commands])
   }

   createComputed(computeBuffers)

   onMount(() => {
      initRenderer()
      canvasWidthHalf = canvasRef.width / 2
      canvasHeightHalf = canvasRef.height / 2
   })

   onCleanup(() => {
      vBuffer?.destroy()
      iBuffer?.destroy()
      viewPortUniformBuffer?.destroy()
      device?.destroy()
   })

   function onPointerDown() {
      isMouseDown = true
   }

   function onPointerMove(e: PointerEvent) {
      if (!isMouseDown) return

      const gpuX = e.offsetX - canvasWidthHalf
      const gpuY = -e.offsetY + canvasHeightHalf

      setStore('points', (v) => v.concat(gpuX, gpuY))
      requestAnimationFrame(frame)
   }

   function onPointerUp() {
      isMouseDown = false
      setStore('points', [])
   }

   return (
      <div>
         <div>
            <canvas
               // class="drawer"
               onPointerDown={onPointerDown}
               onPointerMove={onPointerMove}
               onPointerUp={onPointerUp}
               onPointerLeave={() => (isMouseDown = false)}
               // onPointerLeave={onDrawEnd}
               // classList={{
               //    ontop: editor.tool !== ToolType.Cursor,
               // }}
               onWheel={(e) => {
                  // let s = -1
                  // if (e.deltaY < 0) s = 1
                  // setStore('viewPort', 'w', (w) => w + s)
                  // e.preventDefault()
               }}
               ref={canvasRef}
               width="900"
               height="800"
            />
         </div>
         {/* <div>
            <h3>Pixi.js - Miro, CloverApp</h3>
            <canvas ref={pixiCanvasRef} width="900" height="900" />
         </div> */}
      </div>
   )
}
