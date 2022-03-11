import Draggable from '@/components/draggable/draggable.component';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { useEditorStore } from '../editor.store';
// Causes an error
import type { Block as BlockEntity } from '../../../lib/entities';
import s from './block.module.scss';

type BlockProps = {
   block: BlockEntity;
};

export function Block(props: BlockProps) {
   const [editor, { onDragStart, onDrag, onDragEnd, gridSize, realSize, getAbsolutePosition, isDragging }] = useEditorStore();

   const isMeDragging = createMemo(() => isDragging() && editor.draggingItem === props.block);

   const [pos, setPos] = createSignal({
      x: props.block.x,
      y: props.block.y,
   });
   // const onBlockDblClick = capacitor((e: MouseEvent & { currentTarget: HTMLDivElement; }) => {
   //    e.preventDefault();
   //    if (editingBlock === e.currentTarget) return;
   //    e.currentTarget.setAttribute('contenteditable', 'true');
   //    e.currentTarget.focus();
   //    editingBlock = e.currentTarget;
   // }, 2);

   // function onBlockUnfocus() {
   //    if (!editingBlock) return;
   //    editingBlock.removeAttribute('contenteditable');
   //    editingBlock = null;
   // }

   // createEffect(() => {
   //    console.log(realSize());
   //    if (!containerRef) return;
   // });
   createEffect(() => {
      setPos(getAbsolutePosition(props.block.x, props.block.y));
   });
   createEffect(() => {
      if (!isMeDragging()) {
         setPos(getAbsolutePosition(props.block.x, props.block.y));
      }
   });

   return (
      <Draggable
         x={pos().x}
         y={pos().y}
         style={{
            width: gridSize(props.block.width) + 'px',
            height: gridSize(props.block.height) + 'px',
         }}
         class={s.block}
         onDragStart={(absX, absY, x, y) => onDragStart(props.block, x, y)}
         onDrag={(absX, absY, x, y) => onDrag(props.block, x, y)}
         onDragEnd={(absX, absY, x, y) => onDragEnd(props.block, x, y)}
      // onClick={onBlockDblClick}
      // onFocusOut={onBlockUnfocus}
      >
      </Draggable>
   );
}