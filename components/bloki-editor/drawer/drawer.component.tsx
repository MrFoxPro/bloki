import s from './drawer.module.scss';
import { createComputed, createEffect, on, onCleanup, onMount } from 'solid-js';
import { plainToInstance } from 'class-transformer';
import { useEditorStore } from '../editor.store';
import { Drawing, DrawingColor, DrawingType, Instrument, MarkerDrawing, Point } from '../types';
import { useAppStore } from '@/lib/app.store';
import { useDrawerStore } from '../drawer.store';

export function Drawer() {
   let canvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;

   let isMouseDown = false;
   let lastPos: Point = {
      x: 0,
      y: 0,
   };

   const [editorStore, { realSize, staticEditorData, setEditorStore }] = useEditorStore();
   const [drawerStore] = useDrawerStore();

   const [, app] = useAppStore();

   createComputed(() => {
      if (drawerStore.instrument !== Instrument.Cursor) {
         setEditorStore({ editingBlock: null, editingType: null });
      }
   });

   onMount(() => {
      ctx = canvasRef.getContext('2d');
   });

   function applyDrawing(context: CanvasRenderingContext2D, drawing: Drawing) {
      if (drawing instanceof MarkerDrawing) {
         context.lineWidth = drawing.strokeWidth;
         context.strokeStyle = drawing.color;
         context.lineJoin = 'round';
         context.lineCap = 'round';
      }
   }

   createEffect(on(
      () => editorStore.document,
      () => {
         editorStore.document.drawings.forEach((drawing) => {
            if (drawing instanceof MarkerDrawing) {
               applyDrawing(ctx, drawing);
               ctx.beginPath();
               drawing.points.forEach((p, i, arr) => {
                  if (i > 0) {
                     drawMarker(arr[i - 1], p);
                  }
               });
            }
         });
      })
   );

   function drawMarker(prev: Point, curr: Point) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
   }
   let currentDrawing: Drawing = null;

   function onDrawStart(e: PointerEvent) {
      isMouseDown = true;
      switch (drawerStore.instrument) {
         case Instrument.Marker:
            currentDrawing = new MarkerDrawing();
            currentDrawing.color = drawerStore.drawingColor;
            currentDrawing.strokeWidth = drawerStore.strokeWidth;
            break;
         case Instrument.Lastik:
            // const drawingsToDelete = editorStore.document.drawings.find(drawing => {
            //    if(drawing instanceof MarkerDrawing) {
            //       return drawing.points.some(p => p.)
            //    }
            // })
         default:
            break;
      }
      if (!currentDrawing) return;

      lastPos.x = e.pageX - staticEditorData.containerRect.x;
      lastPos.y = e.pageY - staticEditorData.containerRect.y;
      applyDrawing(ctx, currentDrawing);
   }

   function onDraw(e: PointerEvent) {
      if (e.buttons !== 1) return;
      if (!isMouseDown) return;

      if (currentDrawing instanceof MarkerDrawing) {
         const point = {
            x: e.pageX - staticEditorData.containerRect.x,
            y: e.pageY - staticEditorData.containerRect.y
         };
         ctx.beginPath();
         drawMarker(lastPos, point);
         lastPos = point;
         currentDrawing.points.push({ ...lastPos });
      }
   }

   function onDrawEnd(e: PointerEvent) {
      isMouseDown = false;
      if (currentDrawing) {
         setEditorStore('document', 'drawings', drawings => drawings.concat(currentDrawing));
         app.apiProvider.updateDocument(editorStore.document);
      }
      currentDrawing = null;
   }

   return (
      <canvas
         class={s.drawer}
         onPointerDown={onDrawStart}
         onPointerUp={onDrawEnd}
         onPointerLeave={onDrawEnd}
         onPointerMove={onDraw}
         classList={{
            [s.ontop]: drawerStore.instrument !== Instrument.Cursor
         }}
         ref={canvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
      />
   );
}