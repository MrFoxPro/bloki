console.clear()
import './whiteboard.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { WebGPURenderer } from './renderer'
import { Point2D, Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   let whiteboard: WebGPURenderer

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      paintings: [] as Painting[],
   })
   let stop = false

   createEffect(async () => {
      if (!canvasRef) return

      document.addEventListener('keydown', (e) => {
         if (e.key === '+') {
            // zoom
            // whiteboard.re
         } else if (e.key === '-') {
            // zoom
         }
      })

      whiteboard = new WebGPURenderer()

      await whiteboard.init(canvasRef)

      // const m = new Mesh()
      // prettier-ignore
      for (let i = 0; i < 5; i++) {
         const dx = i* 20
         const staticLine = new Line([
            -20 + dx, 20,
            20 + dx, 20,
            20 + dx, -20,
            -20+ dx, -20,
            -20 +dx, 20
         ])
         whiteboard.sMem.addMesh(staticLine)
      }

      // whiteboard.render()
      // const staticLine = new Line([
      //       -20, 20,
      //       20, 20,
      //       20, -20,
      //       -20, -20,
      //       -20, 20
      //    ])
      // whiteboard.sMem.add(staticLine)
      // whiteboard.render()

      // setInterval(() => {
      //    staticLine.color = [Math.random(), Math.random(), Math.random(), 1]
      //    whiteboard.render()
      // }, 1000)

      // const two = wgpu.createDynamicLine()
      // two.lineTo([30, 30])
      // two.lineTo([50, 30])
      // two.lineTo([50, 50])
      // two.lineTo([30, 50])
      // two.lineTo([30, 30])
   })

   onCleanup(() => {
      stop = true
      whiteboard.dispose()
   })

   let lastPointMouseDown: [number, number] | null = null

   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      if (editor.tool !== ToolType.Pen) return
      lastPointMouseDown = [e.offsetX, e.offsetY]
      canvasRef.onpointermove = onPointerMove
   }

   let currentLine: Line = null
   function onPointerMove(e: PointerEvent) {
      if (!lastPointMouseDown) return
      const point: Point2DTupleView = [e.offsetX, e.offsetY]
      whiteboard.canvasCoordsToWebgpu(lastPointMouseDown)
      whiteboard.canvasCoordsToWebgpu(point)
      if (!currentLine) {
         currentLine = new Line([...lastPointMouseDown, ...point])
         whiteboard.dMem.addMesh(currentLine)
      } else currentLine.lineTo(point)
      whiteboard.render()
   }

   function onPointerUp() {
      endDrawing()
   }

   function endDrawing() {
      canvasRef.onpointermove = null
      lastPointMouseDown = null
      currentLine = null
   }

   return (
      <>
         <canvas
            ref={canvasRef}
            class="drawer"
            width={toAbs(editor.doc.gridOptions.width)}
            height={toAbs(editor.doc.gridOptions.height)}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => (lastPointMouseDown = null)}
         />
      </>
   )
}
