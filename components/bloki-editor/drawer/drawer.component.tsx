import s from './drawer.module.scss';
import { createComputed, createEffect, createRenderEffect, on, onMount } from 'solid-js';
import { useEditorStore } from '../editor.store';
import { useDrawerStore } from '../drawer.store';
import { Point } from '../types/blocks';
import { Drawing, LastikDrawing, MarkerDrawing } from '../types/drawings';
import { Instrument } from '../types/editor';

import LastikCursor from './assets/lastik.cursor.png';
import MarkerCursor from './assets/marker.cursor.png';
import { toBlobAsync } from './helpers';
import { baseApiUrl } from '@/lib/app.store';

const cursorOffset: Point = {
   x: 4,
   y: 15,
};
const instrumentCursorMap = {
   [Instrument.Lastik]: LastikCursor,
   [Instrument.Marker]: MarkerCursor
} as const;

// TODO: Refactor this!!!
export function Drawer() {
   let canvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;

   let isMouseDown = false;
   let lastPos: Point = {
      x: 0,
      y: 0,
   };
   const [editor, { realSize, staticEditorData, setEditorStore }] = useEditorStore();
   const [drawer, { setDrawerStore }] = useDrawerStore();
   createComputed(() => {
      if (drawer.instrument !== Instrument.Cursor) {
         setEditorStore({ editingBlock: null, editingType: null });
      }
   });

   onMount(() => {
      ctx = canvasRef.getContext('2d');
   });

   function applyDrawing(context: CanvasRenderingContext2D, drawing: Drawing) {
      if (drawing instanceof MarkerDrawing) {
         context.globalCompositeOperation = 'source-over';
         context.lineWidth = drawing.strokeWidth;
         context.strokeStyle = drawing.color;
         context.lineJoin = 'round';
         context.lineCap = 'round';
      }
      else if (drawing instanceof LastikDrawing) {
         context.globalCompositeOperation = 'destination-out';
         context.lineWidth = drawing.strokeWidth;
         context.strokeStyle = drawing.color;
         context.lineJoin = 'round';
         context.lineCap = 'round';
      }
   }

   function getWhiteBoardData() {
      return fetch(`${baseApiUrl}/${editor.document.id}/blob`).then(r => r.blob());
   }
   createEffect(() => {
      getWhiteBoardData()
         .then((blob) => setDrawerStore({ blob }))
         .catch(e => console.warn('Unable to download drawing!', e));
   });

   createEffect(async () => {
      if (!drawer.blob) return;
      console.log('redrawing whiteboard');
      const bitmap = await createImageBitmap(drawer.blob);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(bitmap, 0, 0);
      // docDraw.drawings.forEach((drawing) => {
      //    if (drawing instanceof MarkerDrawing || drawing instanceof LastikDrawing) {
      //       applyDrawing(ctx, drawing);
      //       ctx.beginPath();
      //       drawing.points.forEach((p, i, arr) => {
      //          if (i > 0) {
      //             drawMarker(arr[i - 1], p);
      //          }
      //       });
      //    }
      // });
   });

   function drawMarker(prev: Point, curr: Point) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
   }

   let currentDrawing: Drawing = null;

   function onDrawStart(e: PointerEvent) {
      isMouseDown = true;
      switch (drawer.instrument) {
         case Instrument.Marker:
            currentDrawing = new MarkerDrawing();
            currentDrawing.color = drawer.drawingColor;
            currentDrawing.strokeWidth = drawer.strokeWidth;
            break;
         case Instrument.Lastik:
            currentDrawing = new LastikDrawing();
            currentDrawing.strokeWidth = drawer.strokeWidth;
         default:
            break;
      }
      if (!currentDrawing) return;

      lastPos.x = e.pageX - staticEditorData.containerRect.x + cursorOffset.x;
      lastPos.y = e.pageY - staticEditorData.containerRect.y + cursorOffset.y;
      applyDrawing(ctx, currentDrawing);
   }

   let wasDrawing = false;
   function onDraw(e: PointerEvent) {
      if (e.buttons !== 1) return;
      if (!isMouseDown) return;

      const point = {
         x: e.pageX - staticEditorData.containerRect.x + cursorOffset.x,
         y: e.pageY - staticEditorData.containerRect.y + cursorOffset.y
      };
      wasDrawing = true;
      if (currentDrawing instanceof MarkerDrawing) {
         ctx.beginPath();
         drawMarker(lastPos, point);
         lastPos = point;
         currentDrawing.points.push({ ...lastPos });
      }
      else if (currentDrawing instanceof LastikDrawing) {
         ctx.beginPath();
         drawMarker(lastPos, point);
         lastPos = point;
         currentDrawing.points.push({ ...lastPos });
      }
   }

   let rasterizeDrawingsTimeout = null;
   // 10 seconds
   const RASTERIZE_TIMEOUT = 5 * 1000;
   async function onDrawEnd(e: PointerEvent) {
      isMouseDown = false;

      if (wasDrawing) {
         processDrawings();
      }
      // if (currentDrawing) {

      // setEditorStore('document', 'whiteboard', 'drawings', drawings => drawings.concat(currentDrawing));

      // if (rasterizeDrawingsTimeout) clearTimeout(rasterizeDrawingsTimeout);
      // rasterizeDrawingsTimeout = setTimeout(processDrawings, RASTERIZE_TIMEOUT);
      // }
      currentDrawing = null;
      wasDrawing = false;
   }

   async function processDrawings() {
      const blob = await toBlobAsync(ctx, 'image/png', 1);
      // const base64 = ctx.canvas.toDataURL('image/png', 1);
      setDrawerStore({ blob });
      // if(editor.document.shared) {

      // }

      // setEditorStore('document', 'whiteboard', 'drawings', []);
      // setEditorStore('document', 'whiteboard', 'blobUrl', imageObjectUrl);


      // app.apiProvider.updateDocument(editorStore.document);
   }
   return (
      <canvas
         class={s.drawer}
         onPointerDown={onDrawStart}
         onPointerUp={onDrawEnd}
         onPointerLeave={onDrawEnd}
         onPointerMove={onDraw}
         classList={{
            [s.ontop]: drawer.instrument !== Instrument.Cursor
         }}
         ref={canvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
         style={{
            cursor: instrumentCursorMap[drawer.instrument] ? `url(${instrumentCursorMap[drawer.instrument]}), crosshair` : 'crosshair'
         }}
      />
   );
}