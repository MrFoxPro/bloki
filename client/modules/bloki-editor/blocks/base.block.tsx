import './base.block.scss';
import { createEffect, createMemo, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useEditorContext } from '../editor.store';
import { TextBlock } from './text/text.block';
import { ImageBlock } from './image/image.block';
import HandyIcon from './assets/handy.svg';
import { AnyBlock, BlockTransform, BlockType, Dimension } from '../types/blocks';
import { CodeBlock } from './code/code.block.component';
import { EditType } from '../types/editor';
import { useAppStore } from '@/modules/app.store';
import { createStore } from 'solid-js/store';
import { isInsideRect } from '../helpers';
import { Roommate } from '@/lib/network.types';

const blockContentTypeMap: Record<BlockType, any> = {
   [BlockType.Image]: ImageBlock,
   [BlockType.Description]: TextBlock,
   [BlockType.Regular]: TextBlock,
   [BlockType.H1]: TextBlock,
   [BlockType.H2]: TextBlock,
   [BlockType.H3]: TextBlock,
   [BlockType.Title]: TextBlock,
   [BlockType.Code]: CodeBlock
};

export enum CursorSide {
   NW,
   N,
   NE,
   E,
   SE,
   S,
   SW,
   W
}

type BlockProps = {
   block: AnyBlock;
   containerRef: HTMLDivElement;
};
export function Block(props: BlockProps) {
   let hitBoxRef!: HTMLDivElement;
   let relX = 0;
   let relY = 0;
   let pointerDown = false;
   let pointerInside = false;
   let capturingSide: CursorSide;
   let getContentDimension: (d: Dimension) => Dimension;
   const { containerRef } = props;

   const [
      editorState,
      { onChangeStart, onChange, onChangeEnd, getAbsoluteSize, getAbsolutePosition, selectBlock, gridSize, setEditorState }
   ] = useEditorContext();
   const [app] = useAppStore();
   const [state, setState] = createStore({
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
      }
   });
   const isMeEditing = createMemo(() => editorState.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && editorState.editingType === EditType.Drag);
   const isMeResizing = createMemo(() => isMeEditing() && editorState.editingType === EditType.Resize);
   const isEditingContent = createMemo(() => isMeEditing() && editorState.editingType === EditType.Content);
   const isMeOverflowing = createMemo(() => editorState.overflowedBlocks.includes(props.block));
   const isMeEditingByRoommate = createMemo(() =>
      editorState.rommates.find((rm) => app.name !== rm.name && rm.workingBlockId === props.block.id)
   );

   createEffect(() => {
      setState('transform', getAbsolutePosition(props.block.x, props.block.y));
   });

   createEffect(() => {
      setState('transform', getAbsoluteSize(props.block.width, props.block.height));
   });

   createEffect(() => {
      if (!isMeDragging() && !isMeResizing()) {
         setState('transform', getAbsolutePosition(props.block.x, props.block.y));
      }
   });

   createEffect(() => {
      if (!isMeResizing()) {
         setState('transform', getAbsoluteSize(props.block.width, props.block.height));
      }
   });

   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement }) {
      if (isMeEditingByRoommate()) return;
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInsideRect(e.pageX, e.pageY, rect)) {
         selectBlock(props.block, EditType.Content);
      } else {
         e.preventDefault();
      }
   }

   let handyWasClicked = false;
   let wasBlockMoved = false;

   function onBoxPointerDown(e: PointerEvent, btn = 0, handy = false) {
      if (isMeEditingByRoommate()) return;
      pointerDown = true;
      if (e.button !== btn) {
         return;
      }
      handyWasClicked = handy;
      // handy is -30px left from block
      relX = !handyWasClicked ? e.offsetX : e.offsetX - 30;
      relY = e.offsetY;
      onChangeStart(props.block, state.transform, EditType.Drag);
      containerRef.setPointerCapture(e.pointerId);
      containerRef.onpointerup = onContainerPointerUp;
      containerRef.onpointermove = onContainerPointerMove;
   }

   function onContainerPointerMove(e: PointerEvent) {
      const x = e.offsetX - relX;
      const y = e.offsetY - relY;
      if (x !== state.transform.x || y !== state.transform.y) {
         wasBlockMoved = true;
         setState('transform', { x, y });
         const { width, height } = state.transform;
         onChange(props.block, { x, y, width, height }, EditType.Drag);
      }
   }

   function onContainerPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      containerRef.releasePointerCapture(e.pointerId);

      pointerDown = false;
      containerRef.onpointermove = null;
      containerRef.onpointerup = null;
      if (wasBlockMoved) {
         const { x, y, width, height } = state.transform;
         onChangeEnd(props.block, { x, y, width, height }, EditType.Drag);
      } else if (handyWasClicked) {
         handyWasClicked = false;
         // selectBlock(props.block);
         setEditorState({
            showContextMenu: true
         });
      }
      wasBlockMoved = false;
   }

   function onHookPointerDown(e: PointerEvent, side: CursorSide) {
      if (e.button !== 0) return;
      if (isMeEditingByRoommate()) return;
      relX = e.offsetX;
      relY = e.offsetY;
      capturingSide = side;
      containerRef.setPointerCapture(e.pointerId);
      containerRef.onpointerup = onDotPointerUp;
      containerRef.onpointermove = onHookPointerMove;
      onChangeStart(props.block, state.transform, EditType.Resize);
   }

   function onHookPointerMove(e: PointerEvent) {
      let { x, y, width, height } = state.transform;
      let εX = 0,
         εY = 0;
      const { gap } = editorState.document.layoutOptions;
      switch (capturingSide) {
         case CursorSide.W: {
            const xc = e.offsetX;
            width += x - xc;
            x = xc;
            εX = gap;
            break;
         }
         case CursorSide.E: {
            width = e.offsetX - state.transform.x;
            break;
         }
         case CursorSide.N: {
            const yc = e.offsetY;
            height += y - yc;
            y = yc;
            εY = gap;
            break;
         }
         case CursorSide.S: {
            height = e.offsetY - state.transform.y;
            break;
         }
         case CursorSide.NW: {
            const yc = e.offsetY;
            height += y - yc;
            y = yc;
            const xc = e.offsetX;
            width += x - xc;
            x = xc;
            εY = gap;
            εX = gap;
            break;
         }
         case CursorSide.NE: {
            width = e.offsetX - state.transform.x;
            const yc = e.offsetY;
            height += y - yc;
            y = yc;
            break;
         }
         case CursorSide.SE: {
            width = e.offsetX - state.transform.x;
            height = e.offsetY - state.transform.y;
            break;
         }
         case CursorSide.SW: {
            const xc = e.offsetX;
            width += x - xc;
            x = xc;
            height = e.offsetY - state.transform.y;
            break;
         }
      }
      // TODO: just calculate minContentRatio?
      if (getContentDimension) {
         const contentDimension = getContentDimension({ width, height });
         if (contentDimension.width > width) {
            if ([CursorSide.W, CursorSide.NW, CursorSide.SW].includes(capturingSide)) {
               x = state.transform.x;
            }
            width = contentDimension.width;
         }
         if (contentDimension.height > height) {
            if ([CursorSide.N, CursorSide.NW, CursorSide.NE].includes(capturingSide)) {
               y = state.transform.y;
            }
            height = contentDimension.height;
         }
      }

      const minWidth = gridSize(1);
      const minHeight = gridSize(1);

      if (width < minWidth) {
         width = minWidth;
         x = state.transform.x;
      }
      if (height < minHeight) {
         height = minHeight;
         y = state.transform.y;
      }

      // batch here?
      setState('transform', { x, y, width, height });
      width += εX;
      height += εY;
      onChange(props.block, { x, y, width, height }, EditType.Resize);
   }

   function onDotPointerUp(e: PointerEvent) {
      containerRef.onpointermove = null;
      containerRef.onpointerup = null;
      containerRef.releasePointerCapture(e.pointerId);
      capturingSide = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, EditType.Resize);
   }

   function onHandyContextMenu(e: MouseEvent) {
      e.preventDefault();
      if (isMeEditingByRoommate()) return;
      selectBlock(props.block);
      setEditorState({
         showContextMenu: true
      });
   }
   return (
      <div
         id={props.block.id}
         class="block draggable"
         style={{
            transform: `translate(${state.transform.x}px, ${state.transform.y}px)`,
            width: `${state.transform.width}px`,
            height: `${state.transform.height}px`,
            // border: isMeEditingByRoommate()?.color ? `2px solid ${isMeEditingByRoommate().color}` : 'unset',
            cursor: isMeEditingByRoommate() ? 'not-allowed' : 'unset'
         }}
         classList={{
            dragging: isMeDragging(),
            selected: isMeEditing(),
            resizing: isMeResizing()
         }}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
      >
         <div class="handy-block">
            <HandyIcon class="handy" onPointerDown={(e) => onBoxPointerDown(e, 0, true)} onContextMenu={onHandyContextMenu} />
         </div>
         <Show when={isMeEditing()}>
            <For
               each={
                  /*@once*/ [
                     [CursorSide.W, 'v'],
                     [CursorSide.N, 'h'],
                     [CursorSide.E, 'v'],
                     [CursorSide.S, 'h']
                  ] as const
               }
            >
               {([side, rot]) => (
                  <svg
                     class="edge"
                     classList={{
                        debug: editorState.document.layoutOptions.showResizeAreas,
                        [CursorSide[side].toLowerCase()]: true
                     }}
                     onPointerDown={(e) => onHookPointerDown(e, side)}
                  >
                     <path d={`M1,1 ${rot}24`} />
                  </svg>
               )}
            </For>
            <For
               // TODO: calculate viewBox with trigonometric expression?
               each={
                  [
                     [CursorSide.NW, 'M11,1 h-5 c-3,0 -5,2 -5,5 v5'],
                     [CursorSide.NE, 'M1,1 h5 c3,0 5,2 5,5 v5'],
                     [CursorSide.SE, 'M1,11 h5 c3,0 5,-2 5,-5 v-5'],
                     [CursorSide.SW, 'M1,1 v5 c0,3 2,5 5,5 h5']
                  ] as const
               }
            >
               {([side, d]) => (
                  <svg
                     class="vert"
                     classList={{
                        debug: editorState.document.layoutOptions.showResizeAreas,
                        [CursorSide[side].toLowerCase()]: true
                     }}
                     onPointerDown={(e) => onHookPointerDown(e, side)}
                  >
                     <path d={d} />
                  </svg>
               )}
            </For>
         </Show>
         {/* This overlay helps with preveinting mouseenter on firing on child elements */}
         <div
            class="overlay"
            ref={hitBoxRef}
            onPointerEnter={() => {
               pointerInside = true;
            }}
            onPointerLeave={() => {
               pointerInside = false;
               if (pointerDown && isMeEditing() && !isMeDragging()) {
                  selectBlock(props.block, EditType.Select);
               }
            }}
            onPointerDown={(e) => onBoxPointerDown(e, 1)}
            onPointerUp={() => (pointerDown = false)}
            onClick={onBoxClick}
         >
            <Dynamic<CommonContentProps>
               component={blockContentTypeMap[props.block.type]}
               block={props.block}
               wrapGetContentDimension={(fn) => (getContentDimension = fn)}
               isEditingContent={isEditingContent()}
               isMeDragging={isMeDragging()}
               isMeEditing={isMeEditing()}
               isMeEditingByRoommate={isMeEditingByRoommate()}
               isMeOverflowing={isMeOverflowing()}
               isMeResizing={isMeResizing()}
               transform={state.transform}
            />
         </div>
      </div>
   );
}

export type CommonContentProps<B extends AnyBlock = AnyBlock> = {
   block: B;
   transform: BlockTransform;
   isMeEditing: boolean;
   isMeDragging: boolean;
   isMeResizing: boolean;
   isMeOverflowing: boolean;
   isEditingContent: boolean;
   isMeEditingByRoommate: Roommate;
   wrapGetContentDimension: (fn: (d: Dimension) => Dimension) => void;
};

type GhostBlockProps = {
   blockRef: HTMLElement;
};
export function GhostBlock(props: GhostBlockProps) {
   const ghost = props.blockRef.cloneNode() as HTMLElement;
   ghost.id = 'ghost';
   ghost.className = 'block ghost';

   const innerContent = props.blockRef.getElementsByClassName('content')[0].cloneNode(true) as HTMLElement;
   innerContent.classList.add('ghost');
   ghost.appendChild(innerContent);
   return ghost;
}
