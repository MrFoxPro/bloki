import './drawer.scss'
import { createComputed, createEffect, createMemo, onCleanup, onMount } from 'solid-js'
import { Transform, Point } from '../types'
import { useEditorContext } from '../toolbox/editor.store'
import triangleShader from './triangle.wgsl?raw'
import { buildNonNativeLine, LINE_CAP, LINE_JOIN, SHAPES } from './line'
import { createStore } from 'solid-js/store'
import { BlokiGPU } from '@/lib/gpu'

import * as PIXI from 'pixi.js'

type Figure = {
   bound: Transform
   points: Point[]
}

const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

const defaultLineStyle = {
   width: 4,
   miterLimit: 1,
   alignment: 0.1,
   cap: LINE_CAP.BUTT,
   join: LINE_JOIN.ROUND,
   color: [0.5, 1, 0.5, 1],
}

function calcLine(points: number[], style = defaultLineStyle) {
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
   // console.log('Geometry:', geometry)
   return geometry
}

export function Drawer() {
   let canvasRef: HTMLCanvasElement
   let pixiCanvasRef: HTMLCanvasElement
   let device: GPUDevice
   let ctx: GPUCanvasContext

   let vBuffer: GPUBuffer
   let iBuffer: GPUBuffer
   let viewPortUniformBuffer: GPUBuffer
   let uniformBindGroup: GPUBindGroup
   let pipeline: GPURenderPipeline

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

   let vbo = new Float32Array()
   let ibo = new Uint32Array()

   const line = createMemo(() => calcLine(store.points))

   const computeBuffers = async () => {
      let verts = []
      for (let i = 1; i < line().points.length; i += 2) {
         verts.push(line().points[i - 1], line().points[i])
         verts.push(0, 1)
         verts.push(...defaultLineStyle.color)
      }
      vbo = new Float32Array(verts)

      ibo = new Uint32Array(line().indices)
      // line().indices

      if (!vBuffer || !iBuffer) return
      // await vBuffer.mapAsync(GPUMapMode.WRITE)
      // new Float32Array(vBuffer.getMappedRange()).set(verts)
      // vBuffer.unmap()

      // await iBuffer.mapAsync(GPUMapMode.WRITE)
      // new Uint32Array(iBuffer.getMappedRange()).set(line().indices)
      // iBuffer.unmap()

      device.queue.writeBuffer(vBuffer, 0, vbo)
      device.queue.writeBuffer(iBuffer, 0, ibo)
      // console.log('Updated buffer')
      frame()

   }

   createComputed(computeBuffers)

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
      // console.log(vbo, ibo)

      vBuffer = BlokiGPU.createBufferFromArray(
         device,
         vbo,
         GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_WRITE
      )

      iBuffer = BlokiGPU.createBufferFromArray(
         device,
         ibo,
         GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_WRITE
      )

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
      frame()
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
      pass.drawIndexed(ibo.length, 1)
      pass.end()

      const commands = commandEncoder.finish()
      device.queue.submit([commands])
   }

   onMount(initRenderer)

   onCleanup(() => {
      vBuffer?.destroy()
      iBuffer?.destroy()
      viewPortUniformBuffer?.destroy()
      device?.destroy()
   })

   let isMouseDown = false

   function onPointerDown() {
      isMouseDown = true
   }

   function onPointerMove(e: PointerEvent) {
      if (!isMouseDown) return

      const gpuX = e.offsetX - canvasRef.width / 2
      const gpuY = canvasRef.height / 2 - e.offsetY

      setStore('points', (v) => v.concat(gpuX, gpuY))
      // frame()
   }

   function onPointerUp() {
      isMouseDown = false
   }

   return (
      <>
         <canvas ref={pixiCanvasRef} width="900" height="900" />
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
            width="800"
            height="800"
         />
      </>
   )
}
