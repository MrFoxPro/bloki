import './canvas.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { onMount } from 'solid-js'
import { Point2DTupleView } from '../types'
import { ToolType } from '../misc'
import { Tweakpane, TWPButton } from 'solid-tweakpane'
import { FatLine2D } from './renderer/mesh/line/line2d'
import { Scene2D } from './renderer/scene2d'

function convertCoords(canvas: HTMLCanvasElement, p: Point2DTupleView) {
   p[0] = p[0] - canvas.width / 2
   p[1] = -p[1] + canvas.height / 2
   return p
}

export function Whiteboard() {
   let canvasRef: HTMLCanvasElement

   const scene = new Scene2D()

   const { editor, toAbs } = useEditorContext()

   onMount(async () => {
      await scene.init(canvasRef)
      scene.load()
      scene.render()
   })

   let mouseDown = false
   let mousePos: Point2DTupleView
   let frameBusy = false
   let currentLine: FatLine2D = null

   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      if (editor.tool !== ToolType.Pen) return
      mouseDown = true
      const pos: Point2DTupleView = [e.offsetX, e.offsetY]
      convertCoords(canvasRef, pos)
      currentLine = new FatLine2D(pos)
      for (let i = 0; i < 3; i++) {
         currentLine.color[i] = Math.random()
      }
      currentLine.build()
      scene.addObject(currentLine)

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
      scene.render()
   }

   function endDrawing() {
      canvasRef.onpointermove = null
      mouseDown = false
      scene.save()
      currentLine = null
   }
   return (
      <>
         <Tweakpane>
            <TWPButton
               title="Flush drawings"
               onClick={() => {
                  scene.flush()
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
