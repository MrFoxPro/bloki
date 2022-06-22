import './backlight.scss';

import { useEditorStore } from '../editor.store';
import { BlockTransform, PlacementStatus } from "../types/blocks";
import { CellState, FillColors } from './shared';
import { createEffect, onCleanup, onMount } from 'solid-js';
import { isInsideRect } from '../helpers';
import { EditType } from '../types/editor';

export function Backlight() {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [store, { gridSize, realSize, staticEditorData }] = useEditorStore();

   createEffect(() => {
      if (backlightCanvasRef) {
         ctx = backlightCanvasRef.getContext('2d');
      }
   });

   function clearProjection(target: BlockTransform, { affected }: PlacementStatus) {
      if (target) {
         clearArea(target);
      }
      for (let i = 0; i < affected.length; i++) {
         clearArea(affected[i]);
      }
   }

   function drawProjection(target: BlockTransform, placement: PlacementStatus) {
      const { intersections, outOfBorder, affected } = placement;

      drawArea(target, CellState.Free);

      for (let i = 0; i < affected.length; i++) {
         drawArea(affected[i], CellState.Affected);
      }

      for (let i = 0; i < intersections.length; i++) {
         drawArea(intersections[i], (x, y) => {
            if (outOfBorder) return CellState.Intersection;
            else if (intersections.some(sect => isInsideRect(x, y, sect))) {
               return CellState.Intersection;
            }
            else return CellState.Free;
         });
      }
   }

   onMount(() => {
      let prevPlacement: PlacementStatus = null;
      let prevRelTransform: BlockTransform = null;

      const unbindChangeEnd = staticEditorData.on('changeend', function () {
         if (prevRelTransform) {
            clearProjection(prevRelTransform, prevPlacement);
            prevPlacement = null;
            prevRelTransform = null;
         }
      });

      // It's very cpu ineffective to use createEffect(on()) here
      // IDK how to implement performant solution here
      const unbindChange = staticEditorData.on('change', function (_, { placement, relTransform }) {
         if (store.editingBlock === null || (![EditType.Resize, EditType.Drag].includes(store.editingType))) return;
         if (prevRelTransform &&
            prevRelTransform.x === relTransform.x &&
            prevRelTransform.y === relTransform.y &&
            prevRelTransform.height === relTransform.height &&
            prevRelTransform.width === relTransform.width
         ) {
            // Skip unwanted updates
            return;
         }
         if (prevRelTransform && prevPlacement) {
            clearProjection(prevRelTransform, prevPlacement);
         }
         drawProjection(relTransform, placement);

         prevPlacement = placement;
         prevRelTransform = relTransform;
      });

      let prevTransform: BlockTransform = null;
      const unbindGridMouseMove = staticEditorData.on('maingridcursormoved', function (transform, isOut) {
         prevTransform && clearArea(prevTransform);
         if (isOut) {
            prevTransform = null;
            return;
         }
         drawArea(transform, CellState.Free);
         prevTransform = transform;
      });

      onCleanup(() => {
         unbindGridMouseMove();
         unbindChange();
         unbindChangeEnd();
      });
   });

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

   function drawArea(transform, cellState) {
      const { x, y, width, height } = transform;
      const { gap, size } = store.document.layoutOptions;

      for (let i = x; i < x + width; i++) {
         const absX = gridSize(i);
         for (let j = y; j < y + height; j++) {
            const absY = gridSize(j);
            roundRect(absX + gap, absY + gap, size, size, 4);
            if (typeof cellState === 'function') ctx.fillStyle = FillColors[cellState(x, y)];
            else ctx.fillStyle = FillColors[cellState];
            ctx.fill();
         }
      }
   }

   function clearArea(transform: BlockTransform) {
      const { gap } = store.document.layoutOptions;
      const { x, y, width, height } = transform;
      ctx.clearRect(gridSize(x) + gap, gridSize(y) + gap, gridSize(width + 1), gridSize(height + 1));
   }

   return (
      <canvas
         class="backlight"
         ref={backlightCanvasRef}
         width={realSize().fGridWidth_px}
         height={realSize().fGridHeight_px}
      />
   );
}
