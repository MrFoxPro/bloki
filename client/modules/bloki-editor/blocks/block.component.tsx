import './block.scss';

import { ComponentProps, createEffect, For, Show, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useEditorStore } from '../editor.store';
import { TextBlock } from './text/text.block.component';
import { ImageBlock } from './image/image.block';
import HandyIcon from './assets/handy.svg';
import { BlockType } from '../types/blocks';
import { BlockStoreProvider, CursorSide, DotState, useBlockStore } from './block.store';
import { CodeBlock } from './code/code.block.component';
import { EditType } from '../types/editor';

const blockContentTypeMap: Record<BlockType, any> = {
   [BlockType.Image]: ImageBlock,

   [BlockType.Description]: TextBlock,
   [BlockType.Regular]: TextBlock,
   [BlockType.H1]: TextBlock,
   [BlockType.H2]: TextBlock,
   [BlockType.H3]: TextBlock,
   [BlockType.Title]: TextBlock,
   [BlockType.Code]: CodeBlock,
};

function Block() {
   const [store, {
      selectBlock,
      setEditorStore
   }] = useEditorStore();

   const [blockState, {
      block,
      shadowed,
      blockData,

      isMeDragging,
      isMeEditing,
      isMeResizing,
      isMeOverflowing,
      isMeEditingByRoommate,
      onBoxPointerDown,
      onBoxClick,
      onHookPointerDown,
   }] = useBlockStore();

   if (shadowed) {
      const { x, y, width, height } = blockState.transform;
      return (
         <div
            class="block"
            style={{
               width: `${width}px`,
               height: `${height}px`,
               transform: `translate(${x}px, ${y}px)`,
            }}
         >
            <Dynamic component={blockContentTypeMap[block.type]} shadowed={true} />
         </div>
      );
   }

   function onHandyContextMenu(e: MouseEvent) {
      e.preventDefault();
      if (isMeEditingByRoommate()) return;
      selectBlock(block);
      setEditorStore({
         showContextMenu: true
      });
   }
   // createEffect(() => console.log(blockState.transform.x, blockState.transform.y));
   return (
      <div
         class="block draggable"
         style={{
            transform: `translate(${blockState.transform.x}px, ${blockState.transform.y}px)`,
            width: `${blockState.transform.width}px`,
            height: `${blockState.transform.height}px`,
            "border": isMeEditingByRoommate()?.color ? `2px solid ${isMeEditingByRoommate().color}` : 'unset',
            cursor: isMeEditingByRoommate() ? 'not-allowed' : 'unset',
         }}
         classList={{
            "dragging": isMeDragging(),
            "selected": isMeEditing(),
            "resizing": isMeResizing(),
         }}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
      >
         <div class="handy-block">
            <HandyIcon
               class="handy"
               // onPointerDown={(e) => onBoxPointerDown(e, 0, true)}
               onContextMenu={onHandyContextMenu}
            />
         </div>
         <Show when={blockState.dot.state !== DotState.None}>
            <div
               class="dot-wrapper"
               style={{
                  transform: `translate(${blockState.dot.x}px, ${blockState.dot.y}px)`,
               }}
            >
               <div
                  class="sizedot"
                  classList={{
                     "expand": blockState.dot.state === DotState.Full,
                  }}
                  style={{
                     transform: `scale(${blockState.dot.state === DotState.Full ? 2.2 : 1})`,
                  }}
               />
            </div>
         </Show>
         {/* This overlay helps with preveinting mouseenter on firing on child elements */}
         <div
            class="overlay"
            ref={blockData.boxRef}
            onPointerEnter={() => {
               blockData.pointerInside = true;
            }}
            onPointerLeave={() => {
               blockData.pointerInside = false;
               if (blockData.pointerDown && isMeEditing() && !isMeDragging()) {
                  selectBlock(block, EditType.Select);
               }
            }}
            onPointerDown={(e) => onBoxPointerDown(e, 1)}
            onPointerUp={() => blockData.pointerDown = false}
            onClick={onBoxClick}
         >
            <Dynamic component={blockContentTypeMap[block.type]} />
         </div>
         <Show when={isMeEditing()}>
            <For each={/*@once*/Object.keys(CursorSide) as (keyof typeof CursorSide)[]}>
               {side => (
                  <div
                     class={`${side.length === 2 ? "vert" : "edge"} ${side.toLowerCase()}`}
                     classList={{
                        ["show-resize-areas"]: store.document.layoutOptions.showResizeAreas
                     }}
                     onPointerDown={(e) => onHookPointerDown(e, CursorSide[side])}
                  />
               )}
            </For>
         </Show>
      </div>
   );
};

type WrappedBlockProps = Omit<ComponentProps<typeof BlockStoreProvider>, 'children'> & ComponentProps<typeof Block>;
function WrappedBlock(props: WrappedBlockProps) {
   const [storeProps, compProps] = splitProps(props, ['block', 'shadowed']);
   return (
      <BlockStoreProvider {...storeProps}>
         <Block {...compProps} />
      </BlockStoreProvider>
   );
}

export {
   WrappedBlock as Block
};
