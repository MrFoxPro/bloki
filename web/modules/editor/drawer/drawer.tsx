import './drawer.scss'
import { createComputed, createEffect, onCleanup, onMount } from 'solid-js'
import { isInsideRect, ToolType } from '../misc'

import { toBlobAsync } from './helpers'
import { Transform, Point } from '../types'
import { useEditorContext } from '../toolbox/editor.store'
import * as twgl from 'twgl.js'

type Figure = {
   bound: Transform
   points: Point[]
}

import triangleShader from './triangle.wgsl?raw'
import { buildNonNativeLine } from './line'

export function Drawer(props: DrawerProps) {
   let canvasRef: HTMLCanvasElement
   let isMouseDown = false
   let lastPos: Point = {
      x: 0,
      y: 0,
   }
   let wasDrawing = false

   const figures: Figure[] = []
   const { editor, setEditorStore, toAbs } = useEditorContext()

   function onPointerDown(e: PointerEvent) {
      // if (editor.tool === ToolType.Cursor) {
      //    const { offsetX, offsetY } = e
      //    const figure = figures.find((f) => isInsideRect(offsetX, offsetY, f.bound))
      //    console.log(figure)
      // } else if (editor.tool === ToolType.Pen) {
      //    // onDrawStart(e)
      // }
   }
   function onDrawStart(e: PointerEvent) {
      isMouseDown = true
      lastPos.x = e.offsetX
      lastPos.y = e.offsetY
      figures.push({
         bound: null,
         points: [lastPos],
      })
   }

   function onDraw(e: PointerEvent) {
      if (e.buttons !== 1) return
      if (!isMouseDown) return
      const point = {
         x: e.offsetX,
         y: e.offsetY,
      }
      wasDrawing = true
      // gl.beginPath()
      drawMarker(lastPos, point)
      figures[figures.length - 1].points.push(point)
      lastPos = point
   }

   function onDrawEnd(e: PointerEvent) {
      if (!isMouseDown) return
      isMouseDown = false
      const figure = figures[figures.length - 1]

      let minX = Number.POSITIVE_INFINITY,
         minY = Number.POSITIVE_INFINITY,
         maxX = Number.NEGATIVE_INFINITY,
         maxY = Number.NEGATIVE_INFINITY

      for (const { x, y } of figure.points) {
         // gl.fillRect(x, y, 5, 5)

         if (x < minX) minX = x
         if (x > maxX) maxX = x

         if (y < minY) minY = y
         if (y > maxY) maxY = y
      }
      figure.bound = { x: minX, width: maxX - minX, y: minY, height: maxY - minY }
      wasDrawing = false

      const mirrored = {
         points: figure.points.map((p) => ({ x: p.x + 150, y: p.y })),
         bound: { x: minX + 150, width: maxX - minX, y: minY, height: maxY - minY },
      }

      makeLine(mirrored, 'blue')
      figures[figures.length - 1] = mirrored
   }

   function makeLine(figure: Figure, color) {
      // gl.strokeStyle = color
      // for (let i = 1; i < figure.points.length; i++) {
      //    gl.moveTo(figure.points[i - 1].x, figure.points[i - 1].y)
      //    gl.lineTo(figure.points[i].x, figure.points[i].y)
      //    gl.stroke()
      // }
      // gl.strokeStyle = 'navy'
      // const { x, y, width, height } = figure.bound
      // gl.moveTo(x, y)
      // gl.lineTo(x + width, y)
      // gl.stroke()
      // gl.moveTo(x + width, y)
      // gl.lineTo(x + width, y + height)
      // gl.stroke()
      // gl.moveTo(x + width, y + height)
      // gl.lineTo(x, y + height)
      // gl.stroke()
      // gl.moveTo(x, y + height)
      // gl.lineTo(x, y)
      // gl.stroke()
   }
   function drawMarker(prev: Point, curr: Point) {
      // gl.lineCap = 'round'
      // gl.lineJoin = 'round'
      // gl.lineWidth = 2
      // gl.strokeStyle = 'black'
      // gl.moveTo(prev.x, prev.y)
      // gl.lineTo(curr.x, curr.y)
      // gl.stroke()
   }

   // onMount(() => {
   // const gl = canvasRef.getContext('web', { antialias: false, alpha: true })
   //    twgl.resizeCanvasToDisplaySize(gl.canvas)
   //    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

   //    const pInfo = twgl.createProgramInfo(gl, [vs, fs], {})
   //    const bInfo = twgl.createBufferInfoFromArrays(gl, {
   //       a_pos: {
   //          data: new Float32Array([
   //             0, 0, 100, 100, 0, 100,

   //             0, 0, 100, 0, 100, 100,

   //             100, 0, 100, 100, 200, 100,

   //             // 100, 0, 200, 0, 200, 100,
   //          ]),
   //          numComponents: 2,
   //       },
   //    })
   //    twgl.setBuffersAndAttributes(gl, pInfo, bInfo)

   //    const success = gl.getProgramParameter(pInfo.program, gl.LINK_STATUS)
   //    if (!success) console.log('Webgl error', success)

   //    let stop = false
   //    function render(time) {
   //       if (stop) return

   //       gl.clearColor(0, 0, 0, 0)
   //       gl.clear(gl.COLOR_BUFFER_BIT)

   //       gl.useProgram(pInfo.program)
   //       twgl.setUniforms(pInfo, {
   //          u_cam: [10, 0, 1],
   //          u_res: [gl.canvas.width, gl.canvas.height],
   //       })
   //       twgl.drawBufferInfo(gl, bInfo, gl.TRIANGLES)

   //       requestAnimationFrame(render)
   //    }
   //    requestAnimationFrame(render)

   //    onCleanup(() => (stop = true))
   // })

   // onMount(() => {
   //    const data = {
   //       shape: {},
   //       points: [
   //          // p1
   //          0, 0,
   //          // p2
   //          5, 5,
   //          // p3
   //          5, 10,
   //          // p4
   //          10, 20,
   //       ],
   //       lineStyle: {
   //          width: 2,
   //          miterLimit: 1,
   //          alignment: 0.5,
   //       },
   //    }
   //    const geometry = {
   //       closePointEps: 1e-4,
   //       points: [],
   //       indices: [],
   //    }
   //    buildNonNativeLine(data, geometry)

   //    console.log('graphicsData', data)
   //    console.log('geometryData', geometry)
   // })

   async function ensureShaderCompiled(shaderModule: GPUShaderModule) {
      const shaderCompileInfo = await shaderModule.compilationInfo()

      if (shaderCompileInfo.messages.length > 0) {
         let hadError = false
         for (const msg of shaderCompileInfo.messages) {
            console.log(`${msg.lineNum}:${msg.linePos} - ${msg.message}`)
            if (msg.type == 'error') hadError = true
         }
         if (hadError) throw new Error('Shader failed to compile')
      }
   }

   onMount(async () => {
      const { gpu } = navigator
      if (!gpu) throw new Error('WebGPU is not supported on this browser.')

      const adapter = await gpu.requestAdapter()
      if (!adapter) throw new Error('WebGPU supported by disabled')

      const device = await adapter.requestDevice()

      const ctx = canvasRef.getContext('webgpu')

      let textureFormat: GPUTextureFormat
      if (gpu.getPreferredCanvasFormat) textureFormat = gpu.getPreferredCanvasFormat()
      // @ts-ignore FF
      else textureFormat = ctx.getPreferredFormat(adapter)
      console.log('Preffered format for device', device, 'is', textureFormat)

      ctx.configure({
         device,
         format: textureFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
         alphaMode: 'opaque',
      })

      const shaderModule = device.createShaderModule({ code: triangleShader })
      await ensureShaderCompiled(shaderModule)

      // Create buffer in GPU
      // We are setting position and color via vec4<f32> in shader
      // sizeof(f32) is 32bit => 4 bytes
      // Since we are doing triangle, we need pass 2 vec4<f32> attributes for three vertices:
      // [pos1, color1], [pos2, color2], [pos3, color3]
      // So we need buffer of size 3(vertices) * 2(attributes) * (4 * 4)(sizeof vec4<f32>) = 96 bytes!
      const buffer = device.createBuffer({
         size: 3 * 2 * 4 * 4,
         usage: GPUBufferUsage.VERTEX,
         mappedAtCreation: true,
      })

      // Map buffer to CPU control
      const mappedRange = buffer.getMappedRange()

      // Set mapped buffer values
      // Interleaved positions and colors
      // 96 bytes total!
      new Float32Array(mappedRange).set([
         // position 0 (4 * 4 bytes)
         1, -1, 0, 1,
         // color 0 (4 * 4 bytes)
         1, 0, 0, 1,
         // position 1 (4 * 4 bytes)
         -1, -1, 0, 1,
         // color 1 (4 * 4 bytes)
         0, 1, 0, 1,
         // position 2 (4 * 4 bytes)
         0, 1, 0, 1,
         // color 2 (4 * 4 bytes)
         0, 0, 1, 1,
      ])
      // Give control over the buffer to GPU again
      buffer.unmap()

      // float32 is 4 bytes
      // float32x4 is 4 numbers for 4 bytes = 4 * 4
      // we have 2 atributes, so arrayStride will be sum of all offsets: 4 * 4 + 4 * 4 = 2 * 4 * 4
      const renderPipeline = await device.createRenderPipelineAsync({
         layout: device.createPipelineLayout({ bindGroupLayouts: [] }),
         vertex: {
            module: shaderModule,
            entryPoint: 'vertex',
            buffers: [
               {
                  arrayStride: 2 * 4 * 4,
                  attributes: [
                     { format: 'float32x4', offset: 0, shaderLocation: 0 },
                     { format: 'float32x4', offset: 4 * 4, shaderLocation: 1 },
                  ],
               },
            ],
         },
         fragment: {
            module: shaderModule,
            entryPoint: 'fragment',
            targets: [{ format: textureFormat }],
         },
      })

      const commandEncoder = device.createCommandEncoder()

      const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]
      // frame rendering stage
      const renderPassEncoder = commandEncoder.beginRenderPass({
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
      renderPassEncoder.setPipeline(renderPipeline)
      renderPassEncoder.setVertexBuffer(0, buffer)
      renderPassEncoder.draw(3, 1, 0, 0)
      if ('end' in renderPassEncoder) renderPassEncoder.end()
      // @ts-ignore FF
      else renderPassEncoder.endPass()

      const commandsBuffer = commandEncoder.finish()

      device.queue.submit([commandsBuffer])
   })
   return (
      <canvas
         class="drawer"
         onPointerDown={onPointerDown}
         onPointerMove={onDraw}
         onPointerUp={onDrawEnd}
         onPointerLeave={onDrawEnd}
         // classList={{
         //    ontop: editor.tool !== ToolType.Cursor,
         // }}
         ref={canvasRef}
         // width={toAbs(editor.doc.gridOptions.width).px}
         // height={toAbs(editor.doc.gridOptions.height).px}
      />
   )
}
