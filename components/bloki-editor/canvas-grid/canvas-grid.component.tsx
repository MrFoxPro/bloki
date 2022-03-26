import s from './canvas-grid.module.scss';
import { onCleanup, onMount } from "solid-js";
import { Intersection, PlacementStatus, Point, useEditorStore } from '../editor.store';
import { throttle } from 'lodash-es';

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [editor, { gridSize, realSize, emitter }] = useEditorStore();

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
      const { gap } = editor.document.layoutOptions;
      if (prev?.length) {
         const first = prev[0];
         const last = prev[prev.length - 1];
         ctx.clearRect(gridSize(first.x) + gap, gridSize(first.y) + gap, gridSize(last.x - first.x + 1), gridSize(last.y - first.y + 1));
      }
   }

   function drawProjection(proj: Point[], placement: PlacementStatus) {
      const { size, gap } = editor.document.layoutOptions;
      const { intersections, correct } = placement;

      for (let i = 0; i < proj.length; i++) {
         const x = proj[i].x;
         const y = proj[i].y;

         const absX = gridSize(x) + gap;
         const absY = gridSize(y) + gap;
         roundRect(absX, absY, size, size, 4);

         if (intersections.some(sect => x >= sect.startX && (x < sect.startX + sect.width) && y >= sect.startY && y < sect.startY + sect.height)) {
            ctx.fillStyle = badFillColor;
         }
         else ctx.fillStyle = okFillColor;

         ctx.fill();
      }
   }

   onMount(() => {
      ctx = backlightCanvasRef.getContext('2d');

      let prev = [];

      const changeEvent = emitter.on('change', (block, stage, { relTransform: { x, y, width, height }, placement: placementStatus }): void => {
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
         if (!editor.editingBlock || (editor.editingType !== 'drag' && editor.editingType !== 'resize')) return;

         if (prev.length) {
            clearProjection(prev);
         }

         const proj = [];
         for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
               proj.push({ x: x + w, y: y + h });
            }
         }

         drawProjection(proj, placementStatus);
         prev = proj;
      });

      onCleanup(() => {
         changeEvent();
      });
   });

   return (
      <canvas
         class={s.backlight}
         ref={backlightCanvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
      />
   );
}