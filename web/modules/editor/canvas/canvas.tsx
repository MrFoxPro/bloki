import './canvas.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, onMount } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Line } from './renderer/line/line'
import { WebGPURenderer } from './renderer/wgpurenderer'
import { Tweakpane, TWPBindGroup, TWPButton, TWPInput } from 'solid-tweakpane'

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

function convertCoords(canvas: HTMLCanvasElement, p: Point2DTupleView) {
   p[0] = p[0] - canvas.width / 2
   p[1] = -p[1] + canvas.height / 2
   return p
}

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   const r = new WebGPURenderer()

   const { editor, toAbs } = useEditorContext()
   const store = createMutable({
      msaa: r.sampleCount,
      zoom: r.zoom,
      cardinal: {
         enable: true,
         tension: 0.5,
         numOfSeg: 4,
      },
   })

   function resetScene() {
      r.objects.forEach((o) => o.remove())
      loadScene(r)
      r.render()
   }

   onMount(async () => {
      await r.init(canvasRef)
      resetScene()
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
      r.dynamic.removeMesh(currentLine)
      if (currentLine?.points.length > 4) {
         currentLine.optimize(settings.tolerance)
         r.dynamic.addMesh(currentLine)
         r.render()
      }
      currentLine = null
      saveScene(r)
   }
   const settings = createMutable({
      tolerance: 1,
   })
   return (
      <>
         <Tweakpane>
            <TWPBindGroup target={settings}>
               <TWPInput
                  key="tolerance"
                  params={{
                     step: 1,
                     max: 200,
                     min: 1,
                  }}
               />
            </TWPBindGroup>
            <TWPButton
               title="Flush drawings"
               onClick={(e) => {
                  localStorage.removeItem(SCENE_KEY)
                  resetScene()
               }}
            />
         </Tweakpane>
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
