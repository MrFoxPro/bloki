console.clear()
import './canvas.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { LineStyle, WebGPURenderer } from './renderer'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'
import { UBO_ARRAY } from './renderer/constants'
import { LINE_CAP, LINE_JOIN } from './renderer/line/algo'

const defaultLineStyle: LineStyle = {
   width: 15,
   miterLimit: 0.01,
   alignment: 0.01,
   cap: LINE_CAP.ROUND,
   join: LINE_JOIN.ROUND,
}

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   let renderer: WebGPURenderer

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      zoom: 0,
   })
   createEffect(() => console.log('Zoom', store.zoom))
   createEffect(async () => {
      if (!canvasRef) return
      document.addEventListener('keydown', (e) => {
         let go = false
         if (e.key === '=') {
            setStore('zoom', (zoom) => zoom + 1)
            go = true
         } else if (e.key === '-') {
            setStore('zoom', (zoom) => zoom - 1)
            go = true
         }
         if (go) {
            renderer.writeUBO(
               new UBO_ARRAY([renderer.canvasHalfWidth, renderer.canvasHalfHeight, 10, 1 + store.zoom / 50])
            )
            renderer.render()
         }
      })

      renderer = new WebGPURenderer()

      await renderer.init(canvasRef)

      // prettier-ignore
      for (let i = 0; i < 5; i++) {
         const dx = i* 20
         const staticLine = new Line([
            -20 + dx, 20,
            20 + dx, 20,
            20 + dx, -20,
            -20+ dx, -20,
            -20 +dx, 20
         ], defaultLineStyle)
         renderer.addStatic(staticLine)
      }
      renderer.render()
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
      renderer.webCoordsToWebgpu(lastPointMouseDown)
      renderer.webCoordsToWebgpu(point)
      if (!currentLine) {
         currentLine = new Line([...lastPointMouseDown, ...point])
         renderer.addDynamic(currentLine)
      } else currentLine.lineTo(point)
      renderer.render()
   }

   function onPointerUp() {
      endDrawing()
   }

   function endDrawing() {
      canvasRef.onpointermove = null
      lastPointMouseDown = null
      if (currentLine) {
         renderer.makeStatic(currentLine)
         currentLine = null
      }
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
