import s from './canvas-grid.module.scss';
import { useEditorStore } from '../../editor.store';
import { BlockTransform } from "../../types";
import { FillColors, IGridImpl, } from '../shared';
import { onMount } from 'solid-js';

export function BlokiCanvasGrid(): IGridImpl {
   let backlightCanvasRef: HTMLCanvasElement;
   let ctx: CanvasRenderingContext2D;
   const [store, { gridSize, realSize }] = useEditorStore();

   onMount(() => ctx = backlightCanvasRef.getContext('2d'));

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

   return {
      drawArea: (transform, cellState) => {
         const { x, y, width, height } = transform;
         const { gap, size } = store.document.layoutOptions;

         for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
               const absX = gridSize(i);
               const absY = gridSize(j);
               roundRect(absX + gap, absY + gap, size, size, 4);
               if (typeof cellState === 'function') ctx.fillStyle = FillColors[cellState(x, y)];
               else ctx.fillStyle = FillColors[cellState];
               ctx.fill();
            }
         }
      },
      clearArea: (transform: BlockTransform) => {
         const { gap } = store.document.layoutOptions;
         const { x, y, width, height } = transform;
         ctx.clearRect(gridSize(x) + gap, gridSize(y) + gap, gridSize(width + 1), gridSize(height + 1));
      },
      component: (
         <canvas
            class={s.backlight}
            ref={backlightCanvasRef}
            width={realSize().fGridWidth_px}
            height={realSize().fGridHeight_px}
         />
      )
   };
}