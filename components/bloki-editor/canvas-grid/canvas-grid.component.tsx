import s from './canvas-grid.module.scss';
import { createEffect } from "solid-js";
import { DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR } from "../defaults";
import { useEditorStore } from '../editor.store';

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;

   const [editor, { isDragging, gridSize }] = useEditorStore();

   createEffect(() => {
      if (!backlightCanvasRef) return;

      const ctx = backlightCanvasRef.getContext('2d');

      console.log(editor.projection);


      // if (isDragging() && editor.projection) {
      //    ctx.fillStyle = 'rgb(200, 0, 0)';
      //    ctx.fillRect(10, 10, 50, 50);

      //    ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      //    ctx.fillRect(30, 30, 50, 50);
      // }
      // else {
      //    ctx.clearRect(10, 10, 50, 50);
      //    ctx.clearRect(30, 30, 50, 50);
      // }
   });

   return (
      <canvas
         class={s.backlight}
         ref={backlightCanvasRef}
         width={gridSize(DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR) + 'px'}
         height={gridSize(30) + 'px'}
      />
   );
}