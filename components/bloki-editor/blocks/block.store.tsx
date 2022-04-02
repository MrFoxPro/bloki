import { Accessor, createComputed, createContext, createEffect, createMemo, onCleanup, PropsWithChildren, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { useEditorStore } from "../editor.store";
import { isInsideRect, distanceBetweenPoints } from "../helpers";
import { AnyBlock, Dimension, Point } from "../types";

const RESIZER_LOD_ACTIVATE_OUTER_LIM = 130;
const RESIZER_ACTIVATE_OUTER_LIM = 30;

const CURSOR_X_OFFSET = 0;
const CURSOR_Y_OFFSET = -1;

export enum DotState {
   None,
   Micro,
   Full
}
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

class BlockData {
   boxRef: HTMLDivElement | undefined;

   relX = 0;
   relY = 0;

   pointerDown = false;
   pointerInside = false;

   capturingSide: CursorSide;

   getContentDimension: (d: Dimension) => Dimension;

   relPoints: Point[];
}

type BlockContextValues = {
   transform: {
      width: number;
      height: number;
      x: number;
      y: number;
   };
   dot: {
      state: DotState;
      x: number;
      y: number;
   };
};
type BlockContextHandlers<B extends AnyBlock = AnyBlock> = {
   isMeEditing: Accessor<boolean>;
   isMeDragging: Accessor<boolean>;
   isMeResizing: Accessor<boolean>;
   isMeOverflowing: Accessor<boolean>;
   onBoxClick: (e: MouseEvent & {
      currentTarget: HTMLDivElement;
   }) => void;
   onPointerMove: (e: PointerEvent) => void;

   onBoxPointerDown: (e: PointerEvent, btn?: number) => void;
   onBoxPointerMove: (e: PointerEvent) => void;
   onBoxPointerUp: (e: PointerEvent) => void;

   onHookPointerDown: (e: PointerEvent, side: CursorSide) => void;
   onHookPointerMove: (e: PointerEvent) => void;

   onDotPointerUp: (e: PointerEvent) => void;

   blockData: BlockData;

   block: B;
   shadowed: boolean;
};


const BlockContext = createContext<[BlockContextValues, BlockContextHandlers]>();

type BlockStoreProviderProps = PropsWithChildren<{
   block: AnyBlock;
   shadowed?: boolean;
}>;
// TODO: refactor this
export function BlockStoreProvider(props: BlockStoreProviderProps) {
   const blockData = new BlockData();
   const [store, {
      editor,
      onChangeStart,
      onChange,
      onChangeEnd,
      getAbsoluteSize,
      getAbsolutePosition,
      selectBlock,
      gridSize,
   }] = useEditorStore();

   const [state, setState] = createStore<BlockContextValues>({
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
      },
      dot: {
         state: DotState.None,
         x: 0,
         y: 0,
      },
   });

   createComputed(() => {
      const x = 0, y = 0;
      blockData.relPoints = [
         { x, y },
         { x: x + state.transform.width, y },
         { x: x + state.transform.width, y: y + state.transform.height },
         { x, y: y + state.transform.height }
      ];
   });

   const isMeEditing = createMemo(() => store.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && store.editingType === 'drag');
   const isMeResizing = createMemo(() => isMeEditing() && store.editingType === 'resize');
   const isMeOverflowing = createMemo(() => store.overflowedBlocks.includes(props.block));

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

   createEffect(() => {
      if (isMeEditing()) {
         window.addEventListener('pointermove', onPointerMove);
      }
      else {
         setState('dot', 'state', DotState.None);
         window.removeEventListener('pointermove', onPointerMove);
      }
   });

   onCleanup(() => {
      window.removeEventListener('pointermove', onPointerMove);
   });

   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInsideRect(e.pageX, e.pageY, rect)) {
         selectBlock(props.block, 'content');
      }
      else {
         e.preventDefault();
      }
   }

   function onPointerMove(e: PointerEvent) {
      if (blockData.pointerInside) {
         setState('dot', { state: DotState.None });
         return;
      }

      // Current mouse point
      const M: Point = {
         x: e.pageX - editor.containerRect.x - state.transform.x + CURSOR_X_OFFSET,
         y: e.pageY - editor.containerRect.y - state.transform.y + CURSOR_Y_OFFSET,
      };

      let dot: Point;
      if (blockData.capturingSide && isMeResizing()) {
         dot = { x: 0, y: 0 };
         switch (blockData.capturingSide) {
            case CursorSide.E:
               dot.x = state.transform.width;
               dot.y = Math.min(Math.max(0, M.y), state.transform.height);
               break;
            case CursorSide.W:
               dot.x = 0;
               dot.y = Math.min(Math.max(0, M.y), state.transform.height);
               break;
            case CursorSide.N:
               dot.y = 0;
               dot.x = Math.min(Math.max(0, M.x), state.transform.width);
               break;
            case CursorSide.S:
               dot.y = state.transform.height;
               dot.x = Math.min(Math.max(0, M.x), state.transform.width);
               break;
            case CursorSide.NW:
               dot.x = 0;
               dot.y = 0;
               break;
            case CursorSide.NE:
               dot.x = state.transform.width;
               dot.y = 0;
               break;
            case CursorSide.SW:
               dot.x = 0;
               dot.y = state.transform.height;
               break;
            case CursorSide.SE:
               dot.x = state.transform.width;
               dot.y = state.transform.height;
               break;
         }
         dot.x -= 3;
         dot.y -= 3;
         setState('dot', {
            state: DotState.Full,
            ...dot
         });
         return;
      }

      let minDist = Number.POSITIVE_INFINITY, edgeIndex: number, t: number;

      for (let i = 0; i < 4; i++) {
         const p1 = blockData.relPoints[!i ? 3 : i - 1];
         const p2 = blockData.relPoints[i];

         const _t = ((M.x - p1.x) * (p2.x - p1.x) + (M.y - p1.y) * (p2.y - p1.y)) / ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

         const _dot: Point = {
            x: p1.x + _t * (p2.x - p1.x),
            y: p1.y + _t * (p2.y - p1.y)
         };

         const dist = distanceBetweenPoints(_dot, M);
         if (dist < minDist) {
            minDist = dist;
            dot = _dot;
            edgeIndex = i;
            t = _t;
         }
      }

      let p: Point;

      if (t > 1) {
         p = blockData.relPoints[edgeIndex];
      }
      else if (t < 0) {
         const newIndex = !edgeIndex ? 3 : edgeIndex - 1;
         p = blockData.relPoints[newIndex];
      }
      if (t < 0 || t > 1) {
         dot.x = p.x;
         dot.y = p.y;
         minDist = distanceBetweenPoints(M, dot);
      }
      let resState = state.dot.state;

      if (!isMeResizing()) {
         if (minDist > RESIZER_LOD_ACTIVATE_OUTER_LIM) {
            resState = DotState.None;
         }
         else if (minDist <= RESIZER_LOD_ACTIVATE_OUTER_LIM && minDist > RESIZER_ACTIVATE_OUTER_LIM) {
            resState = DotState.Micro;
         }
         else if (minDist <= RESIZER_ACTIVATE_OUTER_LIM) {
            resState = DotState.Full;
         }
      }
      dot.x -= (resState === DotState.Full ? 3 : 2);
      dot.y -= (resState === DotState.Full ? 3 : 2);

      setState('dot', {
         state: resState,
         x: dot.x,
         y: dot.y,
      });
   }

   function onBoxPointerDown(e: PointerEvent, btn = 0) {
      blockData.pointerDown = true;
      if (e.button !== btn) {
         return;
      }

      const box = blockData.boxRef.getBoundingClientRect();

      const body = document.body;
      blockData.relX = e.pageX - (box.left + body.scrollLeft - body.clientLeft);
      blockData.relY = e.pageY - (box.top + body.scrollTop - body.clientTop);

      onChangeStart(props.block, state.transform, 'drag');

      blockData.boxRef.onpointermove = onBoxPointerMove;
      blockData.boxRef.onpointerup = onBoxPointerUp;
      blockData.boxRef.setPointerCapture(e.pointerId);
   }

   function onBoxPointerMove(e: PointerEvent) {
      const x = e.pageX - blockData.relX - editor.containerRect.x;
      const y = e.pageY - blockData.relY - editor.containerRect.y;
      if (x !== state.transform.x || y !== state.transform.y) {
         setState('transform', { x, y });
         const { width, height } = state.transform;
         onChange(props.block, { x, y, width, height }, 'drag');
      }
   }

   function onBoxPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blockData.pointerDown = false;
      blockData.boxRef.onpointermove = null;
      blockData.boxRef.onpointerup = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'drag');
   }

   function onHookPointerDown(e: PointerEvent, side: CursorSide) {
      blockData.relX = e.pageX;
      blockData.relY = e.pageY;

      blockData.capturingSide = side;

      const dot = e.currentTarget as HTMLDivElement;
      dot.setPointerCapture(e.pointerId);
      dot.onpointerup = onDotPointerUp;
      dot.onpointermove = onHookPointerMove;

      onChangeStart(props.block, state.transform, 'resize');
   }

   function onHookPointerMove(e: PointerEvent) {
      if (state.dot.state === DotState.None) return;

      let { x, y, width, height } = state.transform;

      let εX = 0, εY = 0;
      switch (blockData.capturingSide) {
         case CursorSide.W: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;

            εX = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.E: {
            width = e.pageX - state.transform.x - editor.containerRect.x;
            break;
         }
         case CursorSide.N: {
            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;

            εY = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.S: {
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
         case CursorSide.NW: {
            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;

            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;

            εY = store.document.layoutOptions.gap;
            εX = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.NE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;

            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;
            break;
         }
         case CursorSide.SE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
         case CursorSide.SW: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
      }
      if (blockData.getContentDimension) {
         const contentDimension = blockData.getContentDimension({ width, height });
         if (contentDimension.width > width) {
            if ([CursorSide.W, CursorSide.NW, CursorSide.SW].includes(blockData.capturingSide)) {
               x = state.transform.x;
            }
            width = contentDimension.width;
         }
         if (contentDimension.height > height) {
            if ([CursorSide.N, CursorSide.NW, CursorSide.NE].includes(blockData.capturingSide)) {
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
      onChange(props.block, { x, y, width, height }, 'resize');
   }

   function onDotPointerUp(e: PointerEvent) {
      const dot = e.currentTarget as HTMLDivElement;
      dot.releasePointerCapture(e.pointerId);
      dot.onpointermove = null;
      dot.onpointerup = null;
      blockData.capturingSide = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'resize');
   }

   const context: [BlockContextValues, BlockContextHandlers] = [
      state,
      {
         block: props.block,
         shadowed: props.shadowed,
         isMeEditing,
         isMeDragging,
         isMeResizing,
         isMeOverflowing,
         onBoxClick,
         onPointerMove,
         onBoxPointerDown,
         onBoxPointerMove,
         onBoxPointerUp,
         onHookPointerDown,
         onHookPointerMove,
         onDotPointerUp,
         blockData
      }
   ];
   return (
      <BlockContext.Provider value={context}>
         {props.children}
      </BlockContext.Provider>
   );
}

export function useBlockStore<T extends AnyBlock>() {
   return useContext(BlockContext) as [BlockContextValues, BlockContextHandlers<T>];
}