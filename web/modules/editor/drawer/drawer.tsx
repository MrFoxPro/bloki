import './drawer.scss'
import { createComputed, createEffect } from 'solid-js'
import { isInsideRect, ToolType } from '../misc'

import { toBlobAsync } from './helpers'
import { Transform, Point } from '../types'
import { useEditorContext } from '../toolbox/editor.store'

type Figure = {
   bound: Transform
   points: Point[]
}

type DrawerProps = {}
export function Drawer(props: DrawerProps) {
   let canvasRef: HTMLCanvasElement
   let ctx: CanvasRenderingContext2D
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
         onDrawStart(e)
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
      ctx.beginPath()
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
         ctx.fillRect(x, y, 5, 5)

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
      ctx.strokeStyle = color
      for (let i = 1; i < figure.points.length; i++) {
         ctx.moveTo(figure.points[i - 1].x, figure.points[i - 1].y)
         ctx.lineTo(figure.points[i].x, figure.points[i].y)
         ctx.stroke()
      }

      ctx.strokeStyle = 'navy'
      const { x, y, width, height } = figure.bound
      ctx.moveTo(x, y)
      ctx.lineTo(x + width, y)
      ctx.stroke()

      ctx.moveTo(x + width, y)
      ctx.lineTo(x + width, y + height)
      ctx.stroke()

      ctx.moveTo(x + width, y + height)
      ctx.lineTo(x, y + height)
      ctx.stroke()

      ctx.moveTo(x, y + height)
      ctx.lineTo(x, y)
      ctx.stroke()
   }

   function drawMarker(prev: Point, curr: Point) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = 'black'

      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(curr.x, curr.y)
      ctx.stroke()
   }

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
         ref={(ref) => {
            canvasRef = ref
            ctx = canvasRef.getContext('2d')
         }}
         width={toAbs(editor.doc.gridOptions.width).px}
         height={toAbs(editor.doc.gridOptions.height).px}
      />
   )
}
