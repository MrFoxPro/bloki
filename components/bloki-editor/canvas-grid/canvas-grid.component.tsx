import s from './canvas-grid.module.scss';
import { onCleanup, onMount } from "solid-js";
import { useEditorStore } from '../editor.store';
import { BlockTransform, PlacementStatus } from "../types";
import { isInsideRect } from '../helpers';

const fillColors = {
   free: '#EDF3FF',
   intersection: '#D8DEE9',
   affected: '#F4F4F4'
} as const;

type CachedPlacement = Pick<PlacementStatus, 'intersections' | 'affected'> & { block: BlockTransform; };

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [store, { gridSize, realSize, editor }] = useEditorStore();

   function roundRect(x: number, y: number, width: number, height: number, radius: number = 4) {
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

   function clearProjection({ affected, block }: CachedPlacement) {
      if (block) {
         clearGrid(block);
      }
      for (let i = 0; i < affected.length; i++) {
         clearGrid(affected[i]);
      }
   }

   function drawProjection(block: BlockTransform, placement: PlacementStatus) {
      const { size, gap } = store.document.layoutOptions;
      const { intersections, outOfBorder, affected } = placement;

      drawGrid(block, fillColors.free);

      for (let i = 0; i < affected.length; i++) {
         drawGrid(affected[i], fillColors.affected);
      }

      // Todo: optimize to one grid to increase rendering performance
      for (let i = 0; i < intersections.length; i++) {
         const { x, y, width, height } = intersections[i];

         for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
               const absX = gridSize(i);
               const absY = gridSize(j);
               roundRect(absX + gap, absY + gap, size, size, 4);

               if (outOfBorder) ctx.fillStyle = fillColors.intersection;
               else if (intersections.some(sect => isInsideRect(x, y, sect))) {
                  ctx.fillStyle = fillColors.intersection;
               }
               else ctx.fillStyle = fillColors.free;
               ctx.fill();
            }
         }
      }
   }

   function drawGrid(transform: BlockTransform, fillColor: string) {
      const { x, y, width, height } = transform;
      const { gap, size } = store.document.layoutOptions;

      ctx.fillStyle = fillColor;
      for (let i = x; i < x + width; i++) {
         for (let j = y; j < y + height; j++) {
            const absX = gridSize(i);
            const absY = gridSize(j);
            roundRect(absX + gap, absY + gap, size, size, 4);
            ctx.fill();
         }
      }
   }

   function clearGrid(transform: BlockTransform) {
      const { gap } = store.document.layoutOptions;
      const { x, y, width, height } = transform;
      ctx.clearRect(gridSize(x) + gap, gridSize(y) + gap, gridSize(width + 1), gridSize(height + 1));
   }

   onMount(() => {
      ctx = backlightCanvasRef.getContext('2d');

      const prevPlacement: CachedPlacement = {
         intersections: [],
         affected: [],
         block: null,
      };

      const unbindChangeEnd = editor.on('changeend', function () {
         clearProjection(prevPlacement);
      });

      const unbindChange = editor.on('change', function (_, { placement, relTransform }) {
         const old = prevPlacement.block;
         if (old &&
            old.x + old.width === relTransform.x + relTransform.width &&
            old.y + old.height === relTransform.y + relTransform.height) {
            // Skip unwanted updates
            return;
         }
         if (!store.editingBlock || (store.editingType !== 'drag' && store.editingType !== 'resize')) return;

         clearProjection(prevPlacement);
         drawProjection(relTransform, placement);

         prevPlacement.affected = placement.affected;
         prevPlacement.intersections = placement.intersections;
         prevPlacement.block = relTransform;
      });

      let prevTransform: BlockTransform = null;
      const unbindGridMouseMove = editor.on('maingridcursormoved', function (transform, isOut) {
         prevTransform && clearGrid(prevTransform);
         if (isOut) {
            prevTransform = null;
            return;
         }
         drawGrid(transform, fillColors.free);
         prevTransform = transform;
      });

      onCleanup(() => {
         unbindGridMouseMove();
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