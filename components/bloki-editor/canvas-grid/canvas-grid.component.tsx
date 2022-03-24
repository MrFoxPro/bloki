import s from './canvas-grid.module.scss';
import { createDeferred, createEffect, createRenderEffect, on, onCleanup } from "solid-js";
import { Point, useEditorStore } from '../editor.store';

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [editor, { gridSize, realSize, emitter }] = useEditorStore();

   createEffect(() => {
      if (!backlightCanvasRef) return;

      ctx = backlightCanvasRef.getContext('2d', {});
   });
   const okFillColor = 'rgba(24, 160, 251, 0.2)';
   const badFillColor = 'rgba(83, 83, 83, 0.2)';

   // const semiOkFillColor = 'rgba(24, 160, 251, 0.08)';
   // const semiBadFillColor = 'rgba(83, 83, 83, 0.08)';

   function roundRect(x: number, y: number, width: number, height: number, radius: number) {
      if (width < 2 * radius) radius = width / 2;
      if (height < 2 * radius) radius = height / 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
   }

   function clearProjection(prev: Point[]) {
      const { size, gap } = editor.document.layoutOptions;
      if (prev?.length) {
         const first = prev[0];
         const last = prev[prev.length - 1];
         ctx.clearRect(gridSize(first.x) + gap, gridSize(first.y) + gap, gridSize(last.x - first.x + 1), gridSize(last.y - first.y + 1));
      }
   }

   function drawProjection(proj: Point[]) {
      const { size, gap } = editor.document.layoutOptions;

      ctx.fillStyle = editor.isPlacementCorrect ? okFillColor : badFillColor;
      for (let i = 0; i < proj.length; i++) {
         roundRect(gridSize(proj[i].x) + gap, gridSize(proj[i].y) + gap, size, size, 4);
         ctx.fill();
      }
   }

   createRenderEffect(() => {
      let prev = [];
      const changeEvent = emitter.on('change', (block, stage, { relTransform: { x, y, width, height } }) => {
         if (stage === 'start') return;
         if (stage === 'end') {
            clearProjection(prev);
            prev = [];
            return;
         }

         const oldNWPoint = prev[0];
         const oldSEPoint = prev[prev.length - 1];
         if (oldNWPoint?.x === x && oldNWPoint?.y === y &&
            oldSEPoint?.x === x + width - 1 && oldSEPoint?.y === y + height - 1) {
            return;
         }

         if (prev.length) {
            clearProjection(prev);
         }

         if (!editor.editingBlock || (editor.editingType !== 'drag' && editor.editingType !== 'resize')) return;

         const proj = [];
         for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
               proj.push({ x: x + w, y: y + h });
            }
         }
         drawProjection(proj);
         prev = proj;
      });

      onCleanup(() => {
         changeEvent();
      });
   });

   // createEffect(
   //    on(
   //       () => editor.projection,
   //       (projC, prevC) => {

   //          const { size, gap } = editor.document.layoutOptions;
   //          if (prev?.length) {
   //             const first = prev[0];
   //             const last = prev[prev.length - 1];
   //             ctx.clearRect(gridSize(first.x) + gap, gridSize(first.y) + gap, gridSize(last.x - first.x + 1), gridSize(last.y - first.y + 1));
   //          }

   //          if (!editor.editingBlock || (editor.editingType !== 'drag' && editor.editingType !== 'resize')) return;

   //          ctx.fillStyle = editor.isPlacementCorrect ? okFillColor : badFillColor;
   //          for (let i = 0; i < proj.length; i++) {
   //             roundRect(gridSize(proj[i].x) + gap, gridSize(proj[i].y) + gap, size, size, 4);
   //             ctx.fill();
   //          }
   //       }
   //    )
   // );

   return (
      <canvas
         class={s.backlight}
         ref={backlightCanvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
      />
   );
}