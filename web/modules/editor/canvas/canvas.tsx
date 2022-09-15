import './canvas.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, onMount, Show } from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { WebGPURenderer } from './renderer'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'
import { convertCoords } from './renderer/utils'

if (import.meta.env.DEV) {
   console.clear()
}

const SCENE_KEY = 'scene'
function loadScene(r: WebGPURenderer) {
   const item = localStorage.getItem(SCENE_KEY)
   if (!item) return
   const data = JSON.parse(item)
   data?.forEach((line) => {
      const mesh = new Line(line.points, line.style)
      r.dynamic.addMesh(mesh)
   })
}
function saveScene(r: WebGPURenderer) {
   const json = JSON.stringify(r.objects.map((o) => ({ points: o.points, style: o.style })))
   localStorage.setItem(SCENE_KEY, json)
}

const S_KEY = 'settings'
function saveSettings(s) {
   const json = JSON.stringify(unwrap(s))
   localStorage.setItem(S_KEY, json)
}
function loadSettings() {
   let item = localStorage.getItem(S_KEY)
   if (item) item = JSON.parse(item)
   else return null
   return item as unknown as ReturnType<typeof getInitialSettings>
}

const initialCardinalSetting = {
   tension: 0.5,
   numOfSeg: 4,
}
const getInitialSettings = (r: WebGPURenderer) => ({
   zoom: r.sampleCount,
   msaa: r.zoom,
   lockLineToFPS: true,
   cardinal: initialCardinalSetting,
})

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   const r = new WebGPURenderer()
   const rr = r.render.bind(r)
   const rafRender = () => requestAnimationFrame(rr)

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore(loadSettings() ?? getInitialSettings(r))

   onMount(async () => {
      await r.init(canvasRef)
      r.zoom = store.zoom
      r.sampleCount = store.msaa
      loadScene(r)
      r.render()
   })

   function rebuildScene() {
      r.objects.forEach((m) => {
         const l = m as Line
         l.style.cardinal = store.cardinal
         l.buildMesh()
      })
      r.render()
   }
   createEffect(() => {
      saveSettings({
         zoom: store.zoom,
         msaa: store.msaa,
         lockLineToFPS: store.lockLineToFPS,
      })
   })

   let mouseDown = false
   let mousePos: Point2DTupleView
   let frameBusy = false
   let currentLine: Line = null

   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      if (editor.tool !== ToolType.Pen) return
      mouseDown = true
      const pos: Point2DTupleView = [e.offsetX, e.offsetY]
      convertCoords(canvasRef, pos)
      currentLine = new Line(pos)
      currentLine.style.cardinal = store.cardinal
      r.dynamic.addMesh(currentLine)
      canvasRef.onpointermove = onPointerMove
   }

   function onPointerMove(e: PointerEvent) {
      mousePos = [e.offsetX, e.offsetY]

      if (!store.lockLineToFPS) {
         draw()
         return
      }

      if (!frameBusy) {
         frameBusy = true
         requestAnimationFrame(draw)
      }
   }

   function draw() {
      frameBusy = false
      if (!mouseDown) return
      convertCoords(canvasRef, mousePos)
      currentLine.lineTo(mousePos)
      r.render()
   }

   function endDrawing() {
      canvasRef.onpointermove = null
      mouseDown = false
      // r.dynamic.removeMesh(currentLine)
      // if (currentLine?.points.length > 4) r.static.addMesh(currentLine)

      currentLine = null
      saveScene(r)
   }

   return (
      <>
         <div
            style={{
               position: 'fixed',
               margin: '15px',
               right: '0',
               width: '250px',
               'z-index': '99999',
               background: 'rgba(255,255,255,0.5)',
               padding: '10px',
               display: 'flex',
               'flex-direction': 'column',
               'row-gap': '10px',
               'align-items': 'start',
            }}
         >
            <div>
               <label>MSAA x{store.msaa}</label>
               <input
                  type="range"
                  value={store.msaa}
                  step={3}
                  min={1}
                  max={4}
                  onInput={(e) => {
                     setStore('msaa', e.currentTarget.valueAsNumber)
                     r.sampleCount = e.currentTarget.valueAsNumber
                     rafRender()
                  }}
               />
            </div>
            <div>
               <label>Zoom {store.zoom}</label>
               <input
                  type="range"
                  value={store.zoom}
                  step={0.01}
                  min={0.1}
                  max={2}
                  onInput={(e) => {
                     setStore('zoom', e.currentTarget.valueAsNumber)
                     r.zoom = e.currentTarget.valueAsNumber
                     rafRender()
                  }}
               />
            </div>
            <div>
               <label>Lock drawing to FPS</label>
               <input
                  type="checkbox"
                  checked={store.lockLineToFPS}
                  onInput={(e) => {
                     setStore('lockLineToFPS', e.currentTarget.checked)
                  }}
               />
            </div>
            <div>
               <label>Enable cardinal spline</label>
               <input
                  type="checkbox"
                  checked={store.cardinal != null}
                  onInput={(e) => {
                     if (e.currentTarget.checked) {
                        setStore('cardinal', initialCardinalSetting)
                     } else setStore('cardinal', null)
                  }}
               />
            </div>
            <Show when={!!store.cardinal}>
               <div>
                  <label>Cardinal tension {store.cardinal.tension}</label>
                  <input
                     type="range"
                     value={store.cardinal.tension}
                     step={0.01}
                     min={0}
                     max={1}
                     onInput={(e) => {
                        setStore('cardinal', 'tension', e.currentTarget.valueAsNumber)
                        rebuildScene()
                     }}
                  />
               </div>
               <div>
                  <label>Cardinal N. of segments {store.cardinal.numOfSeg}</label>
                  <input
                     type="range"
                     value={store.cardinal.numOfSeg}
                     step={1}
                     min={4}
                     max={45}
                     onInput={(e) => {
                        setStore('cardinal', 'numOfSeg', e.currentTarget.valueAsNumber)
                        rebuildScene()
                     }}
                  />
               </div>
            </Show>
            <button onClick={rebuildScene}>Rebuild scene & rerender</button>
            <button
               onClick={() => {
                  localStorage.removeItem(SCENE_KEY)
                  location.reload()
               }}
            >
               Flush drawings
            </button>
            <button
               onClick={() => {
                  localStorage.removeItem(S_KEY)
                  location.reload()
               }}
            >
               Flush settings
            </button>
         </div>
         <canvas
            ref={canvasRef}
            class="drawer"
            width={toAbs(editor.doc.gridOptions.width)}
            height={toAbs(editor.doc.gridOptions.height)}
            onPointerDown={onPointerDown}
            onPointerUp={endDrawing}
            // onPointerLeave={() => (mouseDownPos = null)}
         />
      </>
   )
}
