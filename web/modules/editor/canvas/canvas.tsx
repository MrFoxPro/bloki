import './canvas.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { LineStyle, WebGPURenderer } from './renderer'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'
import { LINE_CAP, LINE_JOIN } from './renderer/line/algo'
import { convertCoords } from './renderer/utils'

const LS_KEY = 'scene'
const defaultLineStyle: LineStyle = {
   width: 15,
   miterLimit: 0.01,
   alignment: 0.01,
   cap: LINE_CAP.ROUND,
   join: LINE_JOIN.ROUND,
}

if (import.meta.env.DEV) {
   console.clear()
}
export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   const drawer = new WebGPURenderer()

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      zoom: drawer.sampleCount,
      msaa: drawer.zoom,
   })

   createEffect(async () => {
      if (!canvasRef) return

      await drawer.init(canvasRef)

      const item = localStorage.getItem(LS_KEY)
      if (!item) return
      const data = JSON.parse(item)
      data?.forEach((line) => {
         const mesh = new Line(line.points, line.style)
         drawer.static.addMesh(mesh)
      })
      // prettier-ignore
      // for (let i = 0; i < 5; i++) {
      //    const dx = i* 60
      //    const staticLine = new Line([
      //       -20 + dx, 20,
      //       20 + dx, 20,
      //       20 + dx, -20,
      //       -20 + dx, -20,
      //       -20 + dx, 20
      //    ], defaultLineStyle)
      //    drawer.static.addMesh(staticLine)
      // }
      drawer.render()
   })

   let lastPointMouseDown: [number, number] | null = null
   let currentLine: Line = null
   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      if (editor.tool !== ToolType.Pen) return
      lastPointMouseDown = [e.offsetX, e.offsetY]
      canvasRef.onpointermove = onPointerMove
   }

   function onPointerMove(e: PointerEvent) {
      if (!lastPointMouseDown) return
      const point: Point2DTupleView = [e.offsetX, e.offsetY]
      convertCoords(canvasRef, lastPointMouseDown)
      convertCoords(canvasRef, point)
      if (!currentLine) {
         currentLine = new Line([...lastPointMouseDown, ...point])
         drawer.dynamic.addMesh(currentLine)
      } else currentLine.lineTo(point)
      drawer.render()
   }

   function onPointerUp() {
      endDrawing()
   }

   function endDrawing() {
      canvasRef.onpointermove = null
      lastPointMouseDown = null
      if (currentLine) {
         drawer.static.addMesh(drawer.dynamic.removeMesh(currentLine))
         currentLine = null
         const json = JSON.stringify(drawer.objects.map((o) => ({ points: o.points, style: o.style })))
         localStorage.setItem(LS_KEY, json)
      }
   }

   return (
      <>
         <div
            style={{
               position: 'fixed',
               margin: '15px',
               right: '0',
               width: '220px',
               'z-index': '99999',
               background: 'rgba(255,255,255,0.5)',
               padding: '10px',
            }}
         >
            <label>MSAA x{store.msaa}</label>
            <input
               id="msaa"
               type="range"
               value={store.msaa}
               step={3}
               min={1}
               max={4}
               onInput={(e) => {
                  setStore('msaa', e.currentTarget.valueAsNumber)
                  drawer.sampleCount = e.currentTarget.valueAsNumber
                  drawer.render()
               }}
            />
            <label>Zoom {store.zoom}</label>
            <input
               id="zoom"
               type="range"
               value={store.zoom}
               step={0.1}
               min={-5}
               max={5}
               onInput={(e) => {
                  setStore('zoom', e.currentTarget.valueAsNumber)
                  drawer.zoom = e.currentTarget.valueAsNumber
                  drawer.render()
               }}
            />
         </div>
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
