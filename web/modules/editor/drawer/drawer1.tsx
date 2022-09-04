console.clear()

// import { useEditorContext } from '../toolbox/editor.store'
import { createEffect, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { IDrawing, WebGPURenderer } from './renderer/webgpu_renderer'
import Stats from 'stats.js'
import { Point } from '../types'

export function DrawerSinglePipeline() {
   let canvasRef: HTMLCanvasElement

   let wgpuRenderer: WebGPURenderer

   // sync

   const [store, setStore] = createStore({
      paintings: [] as Painting[],
   })
   let stop = false
   let stats: Stats

   createEffect(async () => {
      if (!canvasRef) return

      wgpuRenderer = new WebGPURenderer()
      await wgpuRenderer.init(canvasRef)
      if (import.meta.env.DEV) {
         stats = new Stats()
         document.body.appendChild(stats.dom)
      }

      const one = wgpuRenderer.createDrawing([-10, -10])
      one.continue([20, 20])
      one.continue([20, -10])
      one.continue([-10, -10])

      const two = wgpuRenderer.createDrawing([30, 30])
      two.continue([50, 30])
      two.continue([50, 50])
      two.continue([30, 30])

      // const r = () => {
      //    if (stop) return
      //    stats.begin()
      //    renderer.renderDynamicDrawings()
      //    renderer.renderStaticDrawings()
      //    stats.end()
      //    requestAnimationFrame(r)
      // }
      // r()
      // initRenderer().then()
   })
   onCleanup(() => {
      stop = true
      document.body.removeChild(stats.dom)
      wgpuRenderer.dispose()
   })
   const renderData: PaintData[] = []
   let painting: PaintData | null = null

   // async function addStaticPaintings(...paintingsToAdd: Painting[]) {
   //    let lastPaint = renderData.at(-1)

   //    for (const paint of paintingsToAdd) {
   //       const mesh = computeLineMesh(paint.points, paint.style)

   //       const pData: PaintData = paint

   //       pData.vbo = meshToVBO(mesh)

   //       pData.ibo = meshToIBO(mesh)

   //       if (lastPaint) {
   //          pData.vboOffset = lastPaint.vboOffset + lastPaint.vbo.length
   //          pData.iboOffset = lastPaint.iboOffset + lastPaint.ibo.length
   //       } else {
   //          pData.vboOffset = 0
   //          pData.iboOffset = 0
   //       }
   //       renderData.push(pData)

   //       lastPaint = pData
   //    }

   //    for (const bInfo of [vInfo, iInfo]) {
   //       const { Array, CHUNK_LENGTH, usage } = bInfo
   //       const bo = new Array(getFullBO(type))
   //       const allocSize = (bo.length + CHUNK_LENGTH) * Array.BYTES_PER_ELEMENT
   //       bInfo.buffer = BlokiGPU.createBufferFromArray(device, bo, usage, allocSize)
   //    }
   // }

   function writePainting() {}
   function removePainting() {}

   function defragmentBuffers() {}

   let lastPointMouseDown: [number, number] | null = null
   function onPointerDown(e: PointerEvent) {
      if (e.button === 1) e.preventDefault()
      lastPointMouseDown = [e.offsetX, e.offsetY]
      canvasRef.onpointermove = onPointerMove
   }

   let currentDrawing: IDrawing = null
   function onPointerMove(e: PointerEvent) {
      const point: Point = [e.offsetX, e.offsetY]
      wgpuRenderer.canvas_coords_to_webgpu(lastPointMouseDown)
      wgpuRenderer.canvas_coords_to_webgpu(point)

      if (!currentDrawing) currentDrawing = wgpuRenderer.createDrawing(lastPointMouseDown)
      currentDrawing.continue(point)
   }

   function onPointerUp() {
      canvasRef.onpointermove = null
      lastPointMouseDown = null
      currentDrawing = null
   }

   return (
      <div>
         <div>
            <canvas
               onPointerDown={onPointerDown}
               onPointerUp={onPointerUp}
               onPointerLeave={() => (lastPointMouseDown = null)}
               ref={canvasRef}
               width="1000"
               height="800"
            />
         </div>
      </div>
   )
}
