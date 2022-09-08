console.clear()
import './drawer.scss'
import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { IDrawing, WebGPURenderer } from './renderer/webgpu_renderer'
import Stats from 'stats.js'
import { Point } from '../types'
import toast from 'solid-toast'

export function Drawer() {
   let canvasRef: HTMLCanvasElement

   let wgpuRenderer: WebGPURenderer

   const { editor, toAbs } = useEditorContext()

   const [store, setStore] = createStore({
      paintings: [] as Painting[],
      statsNode: null as HTMLElement,
   })
   let stop = false
   let stats: Stats

   createEffect(async () => {
      if (!canvasRef) return

      document.addEventListener('keydown', (e) => {
         if (e.key === '+') {
            // zoom
            // wgpuRenderer.viewport_uniform_buffer.
         } else if (e.key === '-') {
            // zoom
         }
      })
      wgpuRenderer = new WebGPURenderer()

      if (import.meta.env.DEV) {
         stats = new Stats()
         stats.vbo = stats.addPanel(new Stats.Panel('vbo', '#ff8', '#221'))
         stats.ibo = stats.addPanel(new Stats.Panel('ibo', '#f8f', '#212'))
         stats.showPanel(0)
         setStore('statsNode', stats.dom)
      }

      console.log(canvasRef.width)

      await wgpuRenderer.init(canvasRef, stats)

      const one = wgpuRenderer.createDrawing([-10, -10])
      one.continue([20, 20])
      one.continue([20, -10])
      one.continue([-10, -10])

      const two = wgpuRenderer.createDrawing([30, 30])
      two.continue([50, 30])
      two.continue([50, 50])
      two.continue([30, 50])
      two.continue([30, 30])
   })

   onCleanup(() => {
      stop = true
      setStore('statsNode', null)
      wgpuRenderer.dispose()
   })

   const renderData: PaintData[] = []
   let painting: PaintData | null = null

   let lastPointMouseDown: [number, number] | null = null
   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      lastPointMouseDown = [e.offsetX, e.offsetY]
      canvasRef.onpointermove = onPointerMove
   }

   let currentDrawing: IDrawing = null
   function onPointerMove(e: PointerEvent) {
      if (!lastPointMouseDown) return
      const point: Point = [e.offsetX, e.offsetY]
      wgpuRenderer.canvas_coords_to_webgpu(lastPointMouseDown)
      wgpuRenderer.canvas_coords_to_webgpu(point)

      if (!currentDrawing) currentDrawing = wgpuRenderer.createDrawing(lastPointMouseDown)
      if (!currentDrawing.continue(point)) {
         endDrawing()
         toast.error('Too long line!')
      }
   }

   function onPointerUp() {
      endDrawing()
   }
   function endDrawing() {
      canvasRef.onpointermove = null
      lastPointMouseDown = null
      currentDrawing = null
   }
   return (
      <>
         {store.statsNode}
         <canvas
            ref={canvasRef}
            class="drawer"
            width={toAbs(editor.doc.gridOptions.width).px}
            height={toAbs(editor.doc.gridOptions.height).px}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => (lastPointMouseDown = null)}
         />
      </>
   )
}
