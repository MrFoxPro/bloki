import cc from 'classcat';
import { batch, ComponentProps, For, Show, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import s from './block.module.scss';
import { useEditorStore } from '../editor.store';
import { TextBlock } from './text/text.block.component';
import { ImageBlock } from './image/image.block.component';
import HandyIcon from './assets/handy.icon.svg';
import { BlockType } from '../types/blocks';
import { BlockStoreProvider, CursorSide, DotState, useBlockStore } from './block.store';
import { CodeBlock } from './code/code.block.component';

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

      onBoxPointerDown,
      onBoxClick,
      onHookPointerDown,
   }] = useBlockStore();

   if (shadowed) {
      const { x, y, width, height } = blockState.transform;
      return (
         <div
            class={s.block}
            style={{
               width: `${width}px`,
               height: `${height}px`,
               transform: `translate(${x}px, ${y}px)`,
            }}
         >
            <Dynamic component={blockContentTypeMap[block.type]} block={block} shadowed />
         </div>
      );
   }

   function onHandyContextMenu(e: MouseEvent) {
      e.preventDefault();
      selectBlock(block);
      setEditorStore({
         showContextMenu: true
      });
   }

   return (
      <div
         class={cc([s.block, s.draggable])}
         style={{
            transform: `translate(${blockState.transform.x}px, ${blockState.transform.y}px)`,
            width: `${blockState.transform.width}px`,
            height: `${blockState.transform.height}px`,
         }}
         classList={{
            [s.dragging]: isMeDragging(),
            [s.selected]: isMeEditing(),
            [s.resizing]: isMeResizing(),
         }}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
      >
         <HandyIcon
            class={s.handy}
            onPointerDown={(e) => onBoxPointerDown(e, 0)}
            onContextMenu={onHandyContextMenu}
         />
         <Show when={blockState.dot.state !== DotState.None}>
            <div
               class={s.dotWrapper}
               style={{
                  transform: `translate(${blockState.dot.x}px, ${blockState.dot.y}px)`,
               }}
            >
               <div
                  class={s.sizedot}
                  classList={{
                     [s.expand]: blockState.dot.state === DotState.Full,
                  }}
                  style={{
                     transform: `scale(${blockState.dot.state === DotState.Full ? 2.2 : 1})`,
                  }}
               />
            </div>
         </Show>
         {/* This overlay helps with preveinting mouseenter on firing on child elements */}
         <div
            class={s.overlay}
            ref={blockData.boxRef}
            onPointerEnter={() => {
               blockData.pointerInside = true;
            }}
            onPointerLeave={() => {
               blockData.pointerInside = false;
               if (blockData.pointerDown && isMeEditing() && !isMeDragging()) {
                  selectBlock(block, 'select');
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
                     class={cc([side.length === 2 ? s.vert : s.edge, s[side.toLowerCase()]])}
                     classList={{
                        [s.showResizeAreas]: store.document.layoutOptions.showResizeAreas
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