import s from './drawer.module.scss';
import { onMount } from 'solid-js';
import { useEditorStore } from '../editor.store';
import { Drawing, DrawingColor, DrawingType, Instrument, MarkerDrawing, Point } from '../types';
import { useAppStore } from '@/lib/app.store';

export function Drawer() {
   let canvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;

   let isMouseDown = false;
   const lastPos: Point = {
      x: 0,
      y: 0,
   };

   const [store, { realSize, editor, setStore }] = useEditorStore();
   const [, app] = useAppStore();

   onMount(() => {
      ctx = canvasRef.getContext('2d');

      store.document.drawings.forEach((drawing) => {
         if (drawing.type === DrawingType.Marker) {
            let prev = { x: 0, y: 0 };
            ctx.beginPath();
            ctx.lineWidth = drawing.strokeWidth;
            ctx.lineCap = 'round';
            ctx.strokeStyle = drawing.color;
            (drawing as MarkerDrawing).points.forEach((p, i, arr) => {
               if (i > 0) {
                  ctx.moveTo(arr[i - 1].x, arr[i - 1].y);
               }
               ctx.lineTo(p.x, p.y);
               ctx.stroke();
               prev = p;
            });
         }
      });
   });

   let currentDrawing: Drawing = {
      type: DrawingType.Marker,
      color: DrawingColor.Red,
      strokeWidth: 5,

   };

   function onDrawStart(e: PointerEvent) {
      isMouseDown = true;
      switch (store.instrument) {
         case Instrument.Marker:
            currentDrawing.type = DrawingType.Marker;
            (currentDrawing as MarkerDrawing).points = [];
            break;
         default:
            break;
      }
      currentDrawing.color = DrawingColor.Blue;
      lastPos.x = e.pageX - editor.containerRect.x;
      lastPos.y = e.pageY - editor.containerRect.y;
   }

   function onDraw(e: PointerEvent) {
      if (e.buttons !== 1) return;
      if (!isMouseDown) return;

      switch (currentDrawing.type) {
         case DrawingType.Marker:
            ctx.beginPath();
            ctx.lineWidth = currentDrawing.strokeWidth;
            ctx.lineCap = 'round';
            ctx.strokeStyle = currentDrawing.color;

            ctx.moveTo(lastPos.x, lastPos.y);
            lastPos.x = e.pageX - editor.containerRect.x;
            lastPos.y = e.pageY - editor.containerRect.y;
            ctx.lineTo(lastPos.x, lastPos.y);
            ctx.stroke();
            (currentDrawing as MarkerDrawing).points.push({ ...lastPos });
            break;

         default:
            break;
      }
   }

   function onDrawEnd(e: PointerEvent) {
      isMouseDown = false;
      console.log('saving drawing', currentDrawing);
      setStore('document', 'drawings', drawings => drawings.concat(currentDrawing));
      app.apiProvider.updateDocument(store.document);
   }

   return (
      <canvas
         class={s.drawer}
         onPointerDown={onDrawStart}
         onPointerUp={onDrawEnd}
         onPointerLeave={onDrawEnd}
         onPointerMove={onDraw}
         classList={{
            [s.ontop]: store.instrument !== Instrument.Cursor
         }}
         ref={canvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
      />
   );
}