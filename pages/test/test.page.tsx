import cc from 'classcat';
import Draggable from '@/components/draggable/draggable.component';
import s from './test.page.module.scss';
import { createStore } from 'solid-js/store'
import { createRenderEffect } from 'solid-js';

export function TestPage() {
   const GRID_CELL_SIZE_PX = 24;
   const GRID_CELL_GAP_PX = 4;
   const MAIN_GRID_FACTOR = 20;
   const FOREGROUND_GRID_FACTOR = 56;

   const [grid, setGrid] = createStore({

   })
   return (
      <main class={s.test}>
         <div class={s.container}>
            <div class={cc([s.grid, s.foregroundGrid])} />
            <div class={cc([s.grid, s.mainGrid])}>
               <Draggable class={s.draggable}>
                  <div contenteditable />
               </Draggable>
            </div>
         </div>
      </main>
   );
}