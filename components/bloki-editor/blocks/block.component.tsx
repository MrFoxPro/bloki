import { createEffect, createMemo, createSignal, For } from 'solid-js';
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
   const [editor, { onDragStart, onDrag, onDragEnd, getAbsoluteSize, getAbsolutePosition, selectBlock }] = useEditorStore();

   if (props.shadowed) {
      const { x, y } = getAbsolutePosition(props.block.x, props.block.y);
      const { width, height } = getAbsoluteSize(props.block.width, props.block.height);
      return (
         <div
            classList={{ [s.block]: true, [s.shadow]: true }}
            style={{
               width: `${width}px`,
               height: `${height}px`,
               transform: `translate(${x}px, ${y}px)`,
            }}
         >
            <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} />
         </div>
      );
   }

   let boxRef: HTMLDivElement | undefined;

   let relX = 0;
   let relY = 0;

   const [fixed, setFixed] = createSignal(false);
   const [pos, setPos] = createSignal(getAbsolutePosition(props.block.x, props.block.y));
   const [size, setSize] = createSignal(getAbsoluteSize(props.block.width, props.block.height));

   const isMeEditing = createMemo(() => editor.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && editor.editingType === 'drag');
   const isMeResizing = createMemo(() => isMeEditing() && editor.editingType === 'resize');
   const isMeSelected = createMemo(() => isMeEditing() && editor.editingType === 'select');

   createEffect(() => {
      setPos(getAbsolutePosition(props.block.x, props.block.y));
   });

   createEffect(() => {
      if (!isMeDragging()) {
         setPos(getAbsolutePosition(props.block.x, props.block.y));
      }
   });

   createEffect(() => {
      setSize(getAbsoluteSize(props.block.width, props.block.height));
   });

   createEffect(() => {
      if (!isMeResizing()) {
         setSize(getAbsoluteSize(props.block.width, props.block.height));
      }
   });

   function onStart(e: PointerEvent) {
      if (!boxRef) throw new Error('boxRef is undefined!');
      const body = document.body;
      const box = boxRef.getBoundingClientRect();

      relX = e.clientX - (box.left + body.scrollLeft - body.clientLeft);
      relY = e.clientY - (box.top + body.scrollTop - body.clientTop);
      console.log(relX, e.pageX);
      // onMouseMove(e, false);
      onDragStart(props.block, e.clientX - relX, e.clientY - relY);
   }

   function onBoxPointerDown(e: PointerEvent, btn = 0) {
      if (e.button !== btn) {
         // boxRef.releasePointerCapture(e.pointerId);
         return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (fixed()) setFixed(false);
      onStart(e);
      boxRef.onpointermove = onBoxPointerMove;
      boxRef.onpointerup = onBoxPointerUp;
      boxRef.setPointerCapture(e.pointerId);
   }

   function onBoxPointerUp(e: PointerEvent) {
      boxRef.onpointermove = null;
      onDragEnd(props.block, pos().x, pos().y);
      e.preventDefault();
   }

   function onBoxPointerMove(e: PointerEvent, notify = true) {
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

   function isInside(x, y, rect: DOMRect) {
      return x < rect.left + rect.width && x > rect.left && y < rect.top + rect.height && y > rect.top;
   }
   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInside(e.clientX, e.clientY, rect)) {
         selectBlock(props.block);
      }
      else {
         e.preventDefault();
      }
   }

   const minimum_size = 20;
   let original_width = 0;
   let original_height = 0;
   let original_x = 0;
   let original_y = 0;

   function onVertPointerDown(e: PointerEvent & { currentTarget: HTMLDivElement; }, vertIndex: number) {
      e.preventDefault();

      const rect = boxRef.getBoundingClientRect();
      original_width = rect.width;
      original_height = rect.height;
      original_x = rect.left;
      original_y = rect.top;

      relX = e.pageX;
      relY = e.pageY;

      e.currentTarget.setPointerCapture(e.pointerId);

      e.currentTarget.onpointerup = (e) => onVertPointerUp(e, vertIndex);
      e.currentTarget.onpointermove = (e) => onVertPointerMove(e, vertIndex);
   }



   function onVertPointerMove(e: PointerEvent, vertIndex: number) {

      let height: number, width: number;

      switch (vertIndex) {
         case 0: {
            width = original_width - (e.pageX - relX);
            height = original_height - (e.pageY - relY);
            if (width > minimum_size) {
               boxRef.style.left = original_x + (e.pageX - relX) + 'px';
            }
            if (height > minimum_size) {
               boxRef.style.top = original_y + (e.pageY - relY) + 'px';
            }
            break;
         }
         case 1: {
            width = original_width + (e.pageX - relX);
            height = original_height - (e.pageY - relY);
            if (height > minimum_size) {
               boxRef.style.top = original_y + (e.pageY - relY) + 'px';
            }
            break;
         }
         case 2: {
            width = original_width + (e.pageX - relX);
            height = original_height + (e.pageY - relY);
            break;
         }
         case 3: {
            width = original_width - (e.pageX - relX);
            height = original_height + (e.pageY - relY);
            if (width > minimum_size) {
               boxRef.style.left = original_x + (e.pageX - relX) + 'px';
            }
            break;
         }
      }
      if (height > minimum_size) {
         boxRef.style.height = height + 'px';
      }
      if (width > minimum_size) {
         boxRef.style.width = width + 'px';
      }
   }

   function onVertPointerUp(e: PointerEvent, vertIndex: number) {
      (e.currentTarget as HTMLDivElement).onpointermove = null;
      (e.currentTarget as HTMLDivElement).onpointerup = null;
   }

   return (
      <div
         style={{
            transform: `translate(${pos().x}px, ${pos().y}px)`,
            width: `${size().width}px`,
            height: `${size().height}px`,
         }}
         classList={{
            [s.block]: true,
            [s.draggable]: true,
            [s.dragging]: isMeDragging(),
            [s.selected]: isMeSelected(),
         }}
         ref={boxRef}
         onClick={onBoxClick}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
         onPointerDown={(e) => onBoxPointerDown(e, 1)}
         onMouseLeave={() => {
            if (!isMeDragging() && isMeSelected()) {
               selectBlock(null);
            }
         }}
         // onPointerMove={(e) => {
         //    // IN CHROME IT IS WORKING OK WITH onMouseLeave. Not in FF. Check: https://bugzilla.mozilla.org/show_bug.cgi?id=1352061. There is a problem when element is overflowing.
         //    if (!isMeDragging() && isMeSelected() && !isInside(e.clientX, e.clientY, boxRef.getBoundingClientRect())) {
         //       selectBlock(null);
         //    }
         // }}
      >
         <svg
            classList={{
               [s.handy]: true,
               [s.dragging]: isMeDragging()
            }}
            width="10"
            height="18"
            viewBox="0 0 10 18"
            onPointerDown={(e) => onBoxPointerDown(e, 0)}
         >
            <path d="M1.5 3.5C2.32843 3.5 3 2.82843 3 2C3 1.17157 2.32843 0.5 1.5 0.5C0.671573 0.5 0 1.17157 0 2C0 2.82843 0.671573 3.5 1.5 3.5Z" />
            <path d="M8.5 3.5C9.32843 3.5 10 2.82843 10 2C10 1.17157 9.32843 0.5 8.5 0.5C7.67157 0.5 7 1.17157 7 2C7 2.82843 7.67157 3.5 8.5 3.5Z" />
            <path d="M1.5 10.5C2.32843 10.5 3 9.82843 3 9C3 8.17157 2.32843 7.5 1.5 7.5C0.671573 7.5 0 8.17157 0 9C0 9.82843 0.671573 10.5 1.5 10.5Z" />
            <path d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z" />
            <path d="M1.5 17.5C2.32843 17.5 3 16.8284 3 16C3 15.1716 2.32843 14.5 1.5 14.5C0.671573 14.5 0 15.1716 0 16C0 16.8284 0.671573 17.5 1.5 17.5Z" />
            <path d="M8.5 17.5C9.32843 17.5 10 16.8284 10 16C10 15.1716 9.32843 14.5 8.5 14.5C7.67157 14.5 7 15.1716 7 16C7 16.8284 7.67157 17.5 8.5 17.5Z" />
         </svg>

         <For each={/*@once*/new Array(4).fill(0)}>
            {(_, i) => (<div class={s.vert} onPointerDown={(e) => onVertPointerDown(e, i())} />)}
         </For>
         <For each={/*@once*/new Array(4).fill(0)}>
            {() => (<div class={s.edge} />)}
         </For>
         <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} selected={isMeSelected()} />
      </div>
   );
};