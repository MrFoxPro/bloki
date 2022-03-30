import s from './canvas-grid.module.scss';
import { onCleanup, onMount } from "solid-js";
import { useEditorStore } from '../editor.store';
import { BlockTransform, PlacementStatus, Point } from "../types";

const fillColors = {
   free: '#D1ECFE',
   intersection: '#B1B1B1',
   intersectedBlock: '#DDDDDD'
} as const;

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [store, { gridSize, realSize, editor }] = useEditorStore();

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

   function clearProjection(prev: Point[], intersected: BlockTransform[]) {
      const { gap } = store.document.layoutOptions;
      if (prev?.length) {
         const first = prev[0];
         const last = prev[prev.length - 1];
         ctx.clearRect(gridSize(first.x) + gap, gridSize(first.y) + gap, gridSize(last.x - first.x + 1), gridSize(last.y - first.y + 1));
      }
      if (intersected?.length) {
         for (let i = 0; i < intersected.length; i++) {
            const { x, y, width, height } = intersected[i];
            ctx.clearRect(gridSize(x) + gap, gridSize(y) + gap, gridSize(width + 1), gridSize(height + 1));
         }
      }
   }

   function drawProjection(proj: Point[], placement: PlacementStatus) {
      const { size, gap } = store.document.layoutOptions;
      const { intersections, outOfBorder, affected: intersectedBlocks } = placement;

      ctx.fillStyle = fillColors.intersectedBlock;
      for (let i = 0; i < intersectedBlocks.length; i++) {
         const { x, y, width, height } = intersectedBlocks[i];
         for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
               const absX = gridSize(i);
               const absY = gridSize(j);
               roundRect(absX + gap, absY + gap, size, size, 4);
               ctx.fill();
            }
         }
      }

      // Todo: optimize to one grid to increase rendering performance
      for (let i = 0; i < proj.length; i++) {
         const x = proj[i].x;
         const y = proj[i].y;

         const absX = gridSize(x) + gap;
         const absY = gridSize(y) + gap;

         roundRect(absX, absY, size, size, 4);

         if (outOfBorder) ctx.fillStyle = fillColors.intersection;

         else if (intersections.some(sect => x >= sect.x && (x < sect.x + sect.width) && y >= sect.y && y < sect.y + sect.height)) {
            ctx.fillStyle = fillColors.intersection;
         }
         else ctx.fillStyle = fillColors.free;

         ctx.fill();
      }
   }

   onMount(() => {
      ctx = backlightCanvasRef.getContext('2d');

      let prevProjection = [];
      let prevIntersected = [];

      const unbindChangeEnd = editor.on('changeend', () => {
         clearProjection(prevProjection, prevIntersected);
         prevProjection = [];
         prevIntersected = [];
      });

      const unbindChange = editor.on('change', (_, { relTransform: { x, y, width, height }, placement }): void => {
         const oldNWPoint = prevProjection[0];
         const oldSEPoint = prevProjection[prevProjection.length - 1];

         if (oldNWPoint?.x === x && oldNWPoint?.y === y &&
            oldSEPoint?.x === x + width - 1 && oldSEPoint?.y === y + height - 1) {
            return;
         }
         if (!store.editingBlock || (store.editingType !== 'drag' && store.editingType !== 'resize')) return;

         if (prevProjection.length) {
            clearProjection(prevProjection, prevIntersected);
         }


         const proj = [];
         for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
               proj.push({ x: x + w, y: y + h });
            }
         }

         drawProjection(proj, placement);
         prevProjection = proj;
         prevIntersected = placement.affected;
      });

      onCleanup(() => {
         unbindChange();
         unbindChangeEnd();
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