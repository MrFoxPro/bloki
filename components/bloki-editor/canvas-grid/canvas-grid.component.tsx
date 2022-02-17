import { createEffect } from "solid-js";
import { gridSize, DEFAULT_FOREGROUND_GRID_FACTOR } from "../config";
import s from './canvas-grid.module.scss';

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;

   createEffect(() => {
      if (!backlightCanvasRef) return;

      const ctx = backlightCanvasRef.getContext('2d');
      ctx.fillStyle = 'rgb(200, 0, 0)';
      ctx.fillRect(10, 10, 50, 50);

      ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      ctx.fillRect(30, 30, 50, 50);
   });

   return (
      <canvas
         class={s.backlight}
         ref={backlightCanvasRef}
         width={gridSize(DEFAULT_FOREGROUND_GRID_FACTOR) + 'px'}
         height={gridSize(30) + 'px'}
      />
   );
}