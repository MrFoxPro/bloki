import Draggable from '@/components/draggable/draggable.component';
import { Component, createEffect, createMemo, createSignal } from 'solid-js';
import { useEditorStore } from '../editor.store';
// Causes an error
import type { AnyBlock, Block as BlockEntity, BlockType } from '@/lib/entities';
import s from './block.module.scss';
import { TextBlock } from './text-block/text.block.component';
import { Dynamic } from 'solid-js/web';


type BlockProps = {
   block: AnyBlock;
   shadowed?: boolean;
};
const blockContentTypeMap: Record<BlockType, typeof Block> = {
   image: null,
   text: TextBlock,
};
export function Block(props: BlockProps) {
   const [editor, { onDragStart, onDrag, onDragEnd, gridSize, realSize, getAbsolutePosition, isDragging }] = useEditorStore();

   if (props.shadowed) {
      const { x, y } = getAbsolutePosition(props.block.x, props.block.y);
      return (
         <Draggable
            classList={{ [s.block]: true, [s.shadow]: true }}
            x={x}
            y={y}
            style={{
               width: gridSize(props.block.width) + 'px',
               height: gridSize(props.block.height) + 'px',
            }}
         />
      );
   }
   const isMeDragging = createMemo(() => isDragging() && editor.draggingBlock === props.block);

   const [pos, setPos] = createSignal({
      x: props.block.x,
      y: props.block.y,
   });

   createEffect(() => {
      setPos(getAbsolutePosition(props.block.x, props.block.y));
   });
   createEffect(() => {
      if (!isMeDragging()) {
         setPos(getAbsolutePosition(props.block.x, props.block.y));
      }
   });
   const [handyRef, setHandyRef] = createSignal<SVGSVGElement>(null);
   const [blockRef, setBlockRef] = createSignal<HTMLElement>(null);

   return (
      <Draggable
         x={pos().x}
         y={pos().y}
         style={{
            width: gridSize(props.block.width) + 'px',
            height: gridSize(props.block.height) + 'px',
         }}
         classList={{ [s.block]: true, [s.dragging]: isMeDragging() }}
         onDragStart={(absX, absY, x, y) => onDragStart(props.block, x, y)}
         onDrag={(absX, absY, x, y) => onDrag(props.block, x, y)}
         onDragEnd={(absX, absY, x, y) => onDragEnd(props.block, x, y)}
         rules={[{ ref: blockRef(), btn: 1 }, { ref: handyRef(), btn: 0 }]}
      >
         <svg
            classList={{
               [s.handy]: true,
               [s.dragging]: isMeDragging()
            }}
            width="10"
            height="18"
            viewBox="0 0 10 18"
            ref={(ref) => setHandyRef(ref)}
         >
            <path d="M1.5 3.5C2.32843 3.5 3 2.82843 3 2C3 1.17157 2.32843 0.5 1.5 0.5C0.671573 0.5 0 1.17157 0 2C0 2.82843 0.671573 3.5 1.5 3.5Z" />
            <path d="M8.5 3.5C9.32843 3.5 10 2.82843 10 2C10 1.17157 9.32843 0.5 8.5 0.5C7.67157 0.5 7 1.17157 7 2C7 2.82843 7.67157 3.5 8.5 3.5Z" />
            <path d="M1.5 10.5C2.32843 10.5 3 9.82843 3 9C3 8.17157 2.32843 7.5 1.5 7.5C0.671573 7.5 0 8.17157 0 9C0 9.82843 0.671573 10.5 1.5 10.5Z" />
            <path d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z" />
            <path d="M1.5 17.5C2.32843 17.5 3 16.8284 3 16C3 15.1716 2.32843 14.5 1.5 14.5C0.671573 14.5 0 15.1716 0 16C0 16.8284 0.671573 17.5 1.5 17.5Z" />
            <path d="M8.5 17.5C9.32843 17.5 10 16.8284 10 16C10 15.1716 9.32843 14.5 8.5 14.5C7.67157 14.5 7 15.1716 7 16C7 16.8284 7.67157 17.5 8.5 17.5Z" />
         </svg>
         <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} ref={(ref) => setBlockRef(ref)} />
      </Draggable>
   );
}