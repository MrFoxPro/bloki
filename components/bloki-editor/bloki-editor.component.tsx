import { capacitor } from '@/lib/capacitor';
import { createEffect, mergeProps } from 'solid-js';
import Draggable from '../draggable/draggable.component';
import s from './bloki-editor.module.scss';
import { gridSize, DEFAULT_FOREGROUND_GRID_FACTOR } from './config';
import cc from 'classcat';


type BlokiEditorProps = {

};

export function BlokiEditor(props: BlokiEditorProps) {

   let editingBlock: HTMLDivElement;
   let backlightCanvasRef: HTMLCanvasElement;

   props = mergeProps({

   }, props);

   createEffect(() => {
      if (!backlightCanvasRef) return;

      const ctx = backlightCanvasRef.getContext('2d');
      ctx.fillStyle = 'rgb(200, 0, 0)';
      ctx.fillRect(10, 10, 50, 50);

      ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
      ctx.fillRect(30, 30, 50, 50);
   });

   const onBlockDblClick = capacitor((e: MouseEvent & { currentTarget: HTMLDivElement; }) => {
      e.preventDefault();
      if (editingBlock === e.currentTarget) return;
      e.currentTarget.setAttribute('contenteditable', 'true');
      e.currentTarget.focus();
      editingBlock = e.currentTarget;
   }, 2);

   function onBlockUnfocus() {
      if (!editingBlock) return;
      editingBlock.removeAttribute('contenteditable');
      editingBlock = null;
   }

   return (
      <div class={s.container}>
         <canvas
            class={s.backlight}
            ref={backlightCanvasRef}
            width={gridSize(DEFAULT_FOREGROUND_GRID_FACTOR) + 'px'}
            height={gridSize(30) + 'px'}
         />
         <div class={cc([s.grid, s.foregroundGrid])} />
         <div class={cc([s.grid, s.mainGrid])}>
         </div>
         <Draggable
            // classList={{ [s.draggable]: true }}
            class={s.block}
            onClick={onBlockDblClick}
            onFocusOut={onBlockUnfocus}
         >
         </Draggable>
      </div>
   );
}