import s from './canvas-grid.module.scss';
import { createComputed, createDeferred, createEffect, on } from "solid-js";
import { DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR } from "../../../lib/test-data/editor-settings";
import { useEditorStore } from '../editor.store';
import { reconcile } from 'solid-js/store';

export function BlokiCanvasGrid() {
   let backlightCanvasRef: HTMLCanvasElement;
   const [, { gridSize }] = useEditorStore();


   // createEffect(() => {
   //    if (!backlightCanvasRef) return;

   //    ctx = backlightCanvasRef.getContext('2d', {});

   // });

   // createEffect(() => {
   //    console.log('updated!', editor.projection);
   // });

   return (
      <canvas
         class={s.backlight}
         ref={backlightCanvasRef}
         width={gridSize(DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR) + 'px'}
         height={gridSize(30) + 'px'}
      />
   );
}