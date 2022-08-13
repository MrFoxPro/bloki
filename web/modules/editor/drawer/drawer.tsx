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

import fs from './shaders/line.frag?raw'
import vs from './shaders/line.vert?raw'

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
      if (editor.tool === ToolType.Cursor) {
         const { offsetX, offsetY } = e
         const figure = figures.find((f) => isInsideRect(offsetX, offsetY, f.bound))
         console.log(figure)
      } else if (editor.tool === ToolType.Pen) {
         // onDrawStart(e)
      }
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

   onMount(() => {
      const gl = canvasRef.getContext('webgl2', { antialias: false, alpha: true })

      twgl.resizeCanvasToDisplaySize(gl.canvas)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      const pInfo = twgl.createProgramInfo(gl, [vs, fs], {})
      const bInfo = twgl.createBufferInfoFromArrays(gl, {
         a_pos: {
            data: new Float32Array([
               0, 0, 100, 100, 0, 100,

               0, 0, 100, 0, 100, 100,

               100, 0, 100, 100, 200, 100,

               // 100, 0, 200, 0, 200, 100,
            ]),
            numComponents: 2,
         },
      })
      twgl.setBuffersAndAttributes(gl, pInfo, bInfo)

      const success = gl.getProgramParameter(pInfo.program, gl.LINK_STATUS)
      if (!success) console.log('Webgl error', success)

      let stop = false
      function render(time) {
         if (stop) return

         gl.clearColor(0, 0, 0, 0)
         gl.clear(gl.COLOR_BUFFER_BIT)

         gl.useProgram(pInfo.program)
         twgl.setUniforms(pInfo, {
            u_cam: [10, 0, 1],
            u_res: [gl.canvas.width, gl.canvas.height],
         })
         twgl.drawBufferInfo(gl, bInfo, gl.TRIANGLES)

         requestAnimationFrame(render)
      }
      requestAnimationFrame(render)

      onCleanup(() => (stop = true))
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
