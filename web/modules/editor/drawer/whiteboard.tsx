console.clear()
import './whiteboard.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { WebGPURenderer } from './renderer'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'
import { UBO_ARRAY } from './renderer/constants'

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   let renderer: WebGPURenderer

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      paintings: [] as Painting[],
      zoom: 0,
   })
   let stop = false

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
               new UBO_ARRAY([renderer.canvasHalfWidth, renderer.canvasHalfHeight, 10, 1 + store.zoom / 40])
            )
            renderer.render()
         }
      })

      renderer = new WebGPURenderer()

      await renderer.init(canvasRef)

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
         renderer.sMem.addMesh(staticLine)
      }
      function r() {
         renderer.render()
         requestAnimationFrame(r)
      }
      r()
      // renderer.render()
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
      renderer.dispose()
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
      renderer.canvasCoordsToWebgpu(lastPointMouseDown)
      renderer.canvasCoordsToWebgpu(point)
      if (!currentLine) {
         currentLine = new Line([...lastPointMouseDown, ...point])
         renderer.dMem.addMesh(currentLine)
      } else currentLine.lineTo(point)
      // renderer.render()
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
         <h2>Zoom: {store.zoom}</h2>
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
