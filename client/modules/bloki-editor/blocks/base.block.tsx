import './base.block.scss';
import { Accessor, createContext, createEffect, createMemo, For, Show, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useEditorStore } from '../editor.store';
import { TextBlock } from './text/text.block';
import { ImageBlock } from './image/image.block';
import HandyIcon from './assets/handy.svg';
import { AnyBlock, BlockType, Dimension } from '../types/blocks';
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
   [BlockType.Code]: CodeBlock,
};

export enum CursorSide {
   NW = 'nw-resize',
   N = 'n-resize',
   NE = 'ne-resize',
   E = 'e-resize',
   SE = 'se-resize',
   S = 's-resize',
   SW = 'sw-resize',
   W = 'w-resize',
}

type BlockContextValues = {
   transform: {
      width: number;
      height: number;
      x: number;
      y: number;
   };
};

type BlockContextHandlers<B extends AnyBlock = AnyBlock> = {
   isMeEditing: Accessor<boolean>;
   isMeDragging: Accessor<boolean>;
   isMeResizing: Accessor<boolean>;
   isMeOverflowing: Accessor<boolean>;
   isEditingContent: Accessor<boolean>;
   isMeEditingByRoommate: Accessor<Roommate>;
   onBoxClick: (e: MouseEvent & {
      currentTarget: HTMLDivElement;
   }) => void;
   onBoxPointerDown: (e: PointerEvent, btn?: number) => void;
   onBoxPointerMove: (e: PointerEvent) => void;
   onBoxPointerUp: (e: PointerEvent) => void;
   onHookPointerDown: (e: PointerEvent, side: CursorSide) => void;
   onHookPointerMove: (e: PointerEvent) => void;
   onDotPointerUp: (e: PointerEvent) => void;
   block: B;
};

const BlockContext = createContext<[BlockContextValues, BlockContextHandlers]>();

type BlockProps = {
   block: AnyBlock;
};
export function Block(props: BlockProps) {



   let boxRef!: HTMLDivElement;
   let relX = 0;
   let relY = 0;
   let pointerDown = false;
   let pointerInside = false;
   let capturingSide: CursorSide;
   let getContentDimension: (d: Dimension) => Dimension;

   const [editorState, {
      staticEditorData,
      onChangeStart,
      onChange,
      onChangeEnd,
      getAbsoluteSize,
      getAbsolutePosition,
      selectBlock,
      gridSize,
      setEditorStore,
   }] = useEditorStore();
   const [app] = useAppStore();
   const [state, setState] = createStore({
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
      },
   });
   const isMeEditing = createMemo(() => editorState.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && editorState.editingType === EditType.Drag);
   const isMeResizing = createMemo(() => isMeEditing() && editorState.editingType === EditType.Resize);
   const isEditingContent = createMemo(() => isMeEditing() && editorState.editingType === EditType.Content);
   const isMeOverflowing = createMemo(() => editorState.overflowedBlocks.includes(props.block));
   const isMeEditingByRoommate = createMemo(() => editorState.rommates.find(rm => app.name !== rm.name && rm.workingBlockId === props.block.id));

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

   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      if (isMeEditingByRoommate()) return;
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInsideRect(e.pageX, e.pageY, rect)) {
         selectBlock(props.block, EditType.Content);
      }
      else {
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
      const box = boxRef.getBoundingClientRect();
      const body = document.body;
      relX = e.pageX - (box.left + body.scrollLeft - body.clientLeft);
      relY = e.pageY - (box.top + body.scrollTop - body.clientTop);
      onChangeStart(props.block, state.transform, EditType.Drag);
      boxRef.onpointermove = onBoxPointerMove;
      boxRef.onpointerup = onBoxPointerUp;
      boxRef.setPointerCapture(e.pointerId);
   }

   function onBoxPointerMove(e: PointerEvent) {
      const x = e.pageX - relX - staticEditorData.containerRect.x;
      const y = e.pageY - relY - staticEditorData.containerRect.y;
      if (x !== state.transform.x || y !== state.transform.y) {
         wasBlockMoved = true;
         setState('transform', { x, y });
         const { width, height } = state.transform;
         onChange(props.block, { x, y, width, height }, EditType.Drag);
      }
   }

   function onBoxPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      pointerDown = false;
      boxRef.onpointermove = null;
      boxRef.onpointerup = null;
      if (wasBlockMoved) {
         const { x, y, width, height } = state.transform;
         onChangeEnd(props.block, { x, y, width, height }, EditType.Drag);
      }
      else if (handyWasClicked) {
         handyWasClicked = false;
         // selectBlock(props.block);
         setEditorStore({
            showContextMenu: true
         });
         console.log(editorState.showContextMenu);
      }
      wasBlockMoved = false;
   }

   function onHookPointerDown(e: PointerEvent, side: CursorSide) {
      if (e.button !== 0) return;
      if (isMeEditingByRoommate()) return;
      relX = e.pageX;
      relY = e.pageY;
      capturingSide = side;
      const dot = e.currentTarget as HTMLDivElement;
      dot.setPointerCapture(e.pointerId);
      dot.onpointerup = onDotPointerUp;
      dot.onpointermove = onHookPointerMove;
      onChangeStart(props.block, state.transform, EditType.Resize);
   }

   function onHookPointerMove(e: PointerEvent) {
      let { x, y, width, height } = state.transform;
      let εX = 0, εY = 0;
      const { containerRect } = staticEditorData;
      switch (capturingSide) {
         case CursorSide.W: {
            const xc = e.pageX - containerRect.x;
            width += x - xc;
            x = xc;
            εX = editorState.document.layoutOptions.gap;
            break;
         }
         case CursorSide.E: {
            width = e.pageX - state.transform.x - containerRect.x;
            break;
         }
         case CursorSide.N: {
            const yc = e.pageY - containerRect.y;
            height += y - yc;
            y = yc;
            εY = editorState.document.layoutOptions.gap;
            break;
         }
         case CursorSide.S: {
            height = e.pageY - state.transform.y - containerRect.y;
            break;
         }
         case CursorSide.NW: {
            const yc = e.pageY - containerRect.y;
            height += y - yc;
            y = yc;
            const xc = e.pageX - containerRect.x;
            width += x - xc;
            x = xc;
            εY = editorState.document.layoutOptions.gap;
            εX = editorState.document.layoutOptions.gap;
            break;
         }
         case CursorSide.NE: {
            width = e.pageX - state.transform.x - containerRect.x;
            const yc = e.pageY - containerRect.y;
            height += y - yc;
            y = yc;
            break;
         }
         case CursorSide.SE: {
            width = e.pageX - state.transform.x - containerRect.x;
            height = e.pageY - state.transform.y - containerRect.y;
            break;
         }
         case CursorSide.SW: {
            const xc = e.pageX - containerRect.x;
            width += x - xc;
            x = xc;
            height = e.pageY - state.transform.y - containerRect.y;
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
      const dot = e.currentTarget as HTMLDivElement;
      dot.releasePointerCapture(e.pointerId);
      dot.onpointermove = null;
      dot.onpointerup = null;
      capturingSide = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, EditType.Resize);
   }

   function onHandyContextMenu(e: MouseEvent) {
      e.preventDefault();
      if (isMeEditingByRoommate()) return;
      selectBlock(props.block);
      setEditorStore({
         showContextMenu: true
      });
   }

   const blockCtx: [BlockContextValues, BlockContextHandlers] = [
      state,
      {
         block: props.block,
         isMeEditing,
         isMeDragging,
         isMeResizing,
         isMeOverflowing,
         isMeEditingByRoommate,
         isEditingContent,
         onBoxClick,
         onBoxPointerDown,
         onBoxPointerMove,
         onBoxPointerUp,
         onHookPointerDown,
         onHookPointerMove,
         onDotPointerUp,
      }
   ];

   return (
      <BlockContext.Provider value={blockCtx}>
         <div
            id={props.block.id}
            class="block draggable"
            style={{
               transform: `translate(${state.transform.x}px, ${state.transform.y}px)`,
               width: `${state.transform.width}px`,
               height: `${state.transform.height}px`,
               border: isMeEditingByRoommate()?.color ? `2px solid ${isMeEditingByRoommate().color}` : 'unset',
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
                  onPointerDown={(e) => onBoxPointerDown(e, 0, true)}
                  onContextMenu={onHandyContextMenu}
               />
            </div>
            {/* This overlay helps with preveinting mouseenter on firing on child elements */}
            <div
               class="overlay"
               ref={boxRef}
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
               onPointerUp={() => pointerDown = false}
               onClick={onBoxClick}
            >
               <Dynamic<CommonContentProps>
                  wrapGetContentDimension={(fn) => getContentDimension = fn}
                  component={blockContentTypeMap[props.block.type]}
               />
            </div>
            <Show when={isMeEditing()}>
               <For each={/*@once*/Object.keys(CursorSide) as (keyof typeof CursorSide)[]}>
                  {side => (
                     <div
                        class={`${side.length === 2 ? "vert" : "edge"} ${side.toLowerCase()}`}
                        classList={{
                           ["show-resize-areas"]: editorState.document.layoutOptions.showResizeAreas
                        }}
                        onPointerDown={(e) => onHookPointerDown(e, CursorSide[side])}
                     />
                  )}
               </For>
            </Show>
         </div>
      </BlockContext.Provider>
   );
};

export function useBlockContext<T extends AnyBlock>() {
   return useContext(BlockContext) as [BlockContextValues, BlockContextHandlers<T>];
}

export type CommonContentProps = {
   wrapGetContentDimension: (fn: (d: Dimension) => Dimension) => void;
};

type GhostBlockProps = {
   blockId: string;
};
export function GhostBlock(props: GhostBlockProps) {
   const node = document.getElementById(props.blockId);
   const ghost = node.cloneNode() as HTMLElement;
   ghost.id = 'ghost';
   ghost.className = 'block ghost';

   const innerContent = node.getElementsByClassName('content')[0].cloneNode(true) as HTMLElement;
   innerContent.classList.add('ghost');
   ghost.appendChild(innerContent);
   return ghost;
}
