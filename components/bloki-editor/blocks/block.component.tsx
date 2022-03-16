import { createComputed, createEffect, createMemo, createSignal, For, onCleanup, onMount } from 'solid-js';
import { useEditorStore } from '../editor.store';
// Causes an error
import type { AnyBlock, BlockType } from '@/lib/entities';
import s from './block.module.scss';

import { Dynamic } from 'solid-js/web';
import { TextBlock } from './text-block/text.block.component';


type BlockProps = {
   block: AnyBlock;
   shadowed?: boolean;
};
const blockContentTypeMap: Record<BlockType, any> = {
   image: null,
   text: TextBlock,
};
export function Block(props: BlockProps) {
   const [editor, { onDragStart, onDrag, onDragEnd, gridSize, getAbsolutePosition, isDragging }] = useEditorStore();

   if (props.shadowed) {
      const { x, y } = getAbsolutePosition(props.block.x, props.block.y);
      return (
         <div
            classList={{ [s.block]: true, [s.shadow]: true }}
            style={{
               width: gridSize(props.block.width) + 'px',
               height: gridSize(props.block.height) + 'px',
               transform: `translate(${x}px, ${y}px)`,
            }}
         />
      );
   }

   let boxRef: HTMLDivElement | undefined;

   let relX = 0;
   let relY = 0;

   const [fixed, setFixed] = createSignal(false);

   const [pos, setPos] = createSignal({
      x: props.block.x,
      y: props.block.y,
   });

   const isMeDragging = createMemo(() => isDragging() && editor.draggingBlock === props.block);

   createEffect(() => {
      setPos(getAbsolutePosition(props.block.x, props.block.y));
   });

   createEffect(() => {
      if (!isMeDragging()) {
         setPos(getAbsolutePosition(props.block.x, props.block.y));
      }
   });

   onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
   });

   createComputed(() => {
      setPos({
         x: props.block.x,
         y: props.block.y
      });
   });

   function onStart(e: MouseEvent) {
      if (!boxRef) throw new Error('boxRef is undefined!');
      const body = document.body;
      const box = boxRef.getBoundingClientRect();
      relX = e.clientX - (box.left + body.scrollLeft - body.clientLeft);
      relY = e.clientY - (box.top + body.scrollTop - body.clientTop);
      // onMouseMove(e, false);
      onDragStart(props.block, e.clientX - relX, e.clientY - relY);
   }

   function onMouseDown(e: MouseEvent, btn = 0) {
      if (e.button !== btn) return;
      if (fixed()) setFixed(false);
      onStart(e);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
      e.stopImmediatePropagation();
   }

   function onMouseUp(e: MouseEvent) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onDragEnd(props.block, pos().x, pos().y);
      e.preventDefault();
   }

   function onMouseMove(e: MouseEvent, notify = true) {
      const parentBox = boxRef.parentElement.getBoundingClientRect();
      const newX = e.clientX - relX - parentBox.x;
      const newY = e.clientY - relY - parentBox.y;
      if (newX !== pos().x || newY !== pos().y) {
         setPos({
            x: newX,
            y: newY
         });
         onDrag(props.block, newX, newY);
      }
   }

   return (
      <div
         style={{
            transform: `translate(${pos().x}px, ${pos().y}px)`,
            width: gridSize(props.block.width) + 25 + 'px',
            height: gridSize(props.block.height) + 'px',
         }}
         classList={{ [s.block]: true, [s.draggable]: true, [s.dragging]: isMeDragging() }}
         ref={boxRef}
      >
         <svg
            classList={{
               [s.handy]: true,
               [s.dragging]: isMeDragging()
            }}
            width="10"
            height="18"
            viewBox="0 0 10 18"
            onMouseDown={(e) => onMouseDown(e, 0)}
         >
            <path d="M1.5 3.5C2.32843 3.5 3 2.82843 3 2C3 1.17157 2.32843 0.5 1.5 0.5C0.671573 0.5 0 1.17157 0 2C0 2.82843 0.671573 3.5 1.5 3.5Z" />
            <path d="M8.5 3.5C9.32843 3.5 10 2.82843 10 2C10 1.17157 9.32843 0.5 8.5 0.5C7.67157 0.5 7 1.17157 7 2C7 2.82843 7.67157 3.5 8.5 3.5Z" />
            <path d="M1.5 10.5C2.32843 10.5 3 9.82843 3 9C3 8.17157 2.32843 7.5 1.5 7.5C0.671573 7.5 0 8.17157 0 9C0 9.82843 0.671573 10.5 1.5 10.5Z" />
            <path d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z" />
            <path d="M1.5 17.5C2.32843 17.5 3 16.8284 3 16C3 15.1716 2.32843 14.5 1.5 14.5C0.671573 14.5 0 15.1716 0 16C0 16.8284 0.671573 17.5 1.5 17.5Z" />
            <path d="M8.5 17.5C9.32843 17.5 10 16.8284 10 16C10 15.1716 9.32843 14.5 8.5 14.5C7.67157 14.5 7 15.1716 7 16C7 16.8284 7.67157 17.5 8.5 17.5Z" />
         </svg>
         {/* <div class={s.borders}> */}
         <div class={s.vert} />
         <div class={s.vert} />
         <div class={s.vert} />
         <div class={s.vert} />

         <div class={s.edge} />
         <div class={s.edge} />
         <div class={s.edge} />
         <div class={s.edge} />

         {/* </div> */}
         <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} onMouseDown={(e) => onMouseDown(e, 1)} />
      </div>
   );
};