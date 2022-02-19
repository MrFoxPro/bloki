import Draggable from '@/components/draggable/draggable.component';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { useEditorStore } from '../editor.store';
// Causes an error
import type { Block as BlockEntity } from '../entities';
import s from './block.module.scss';

type BlockProps = {
   block: BlockEntity;
};

export function Block(props: BlockProps) {
   const [pos, setPos] = createSignal({
      x: 0,
      y: 0,
   });

   const [editor, { onDragStart, onDrag, onDragEnd, gridSize, realSize, locker, isDragging }] = useEditorStore();

   const isMeDragging = createMemo(() => isDragging() && editor.draggingItem === props.block);

   createEffect(() => {
      function onForce() {
      }
      locker.addLockListener(onForce);

      onCleanup(() => locker.removeLockListener(onForce));
   });

   return (
      <Draggable
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