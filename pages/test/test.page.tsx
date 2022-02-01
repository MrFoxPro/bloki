import cc from 'classcat';
import Draggable from '@/components/draggable/draggable.component';
import s from './test.page.module.scss';
import { createStore } from 'solid-js/store'
import { createEffect } from 'solid-js';
import { FOREGROUND_GRID_FACTOR, gridSize } from './config';
import { Block } from './entities';
import { capacitor } from '@/lib/capacitor';


export function TestPage() {

   let editingBlock: HTMLDivElement;
   let backlightCanvasRef: HTMLCanvasElement;
   createEffect(() => {
      if (!backlightCanvasRef) return

      const ctx = backlightCanvasRef.getContext('2d');

      ctx.fillStyle = 'rgb(200, 0, 0)';
      ctx.fillRect(10, 10, 50, 50);

      ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      ctx.fillRect(30, 30, 50, 50);
   })

   const [blocks, setBlocks] = createStore([
      { b: true }
   ])

   type DblClickEvent = MouseEvent & { currentTarget: HTMLDivElement };


   const onBlockDblClick = capacitor(function (e: DblClickEvent) {
      e.preventDefault();
      if (editingBlock === e.currentTarget) return
      e.currentTarget.setAttribute('contenteditable', 'true')
      e.currentTarget.focus()
      editingBlock = e.currentTarget
      setBlocks(0, 'b', true)
   }, 2);

   function onBlockUnfocus() {
      if (!editingBlock) return
      // const attr = editingBlock.getAttributeNode('contenteditable')
      // console.log(attr)
      editingBlock.removeAttribute('contenteditable')
      editingBlock = null
   }
   return (
      <main class={s.test}>
         <div class={s.container}>
            <canvas
               class={s.backlight}
               ref={backlightCanvasRef}
               width={gridSize(FOREGROUND_GRID_FACTOR) + 'px'}
               height={gridSize(30) + 'px'}
            />
            <div class={cc([s.grid, s.foregroundGrid])} />
            <div class={cc([s.grid, s.mainGrid])}>
            </div>
            <Draggable class={s.draggable} onClick={onBlockDblClick} onFocusOut={onBlockUnfocus}>
            </Draggable>
         </div>
      </main>
   );
}