import { useAppStore } from "@/modules/app.store";
import { Roommate } from "@/lib/network.types";
import { Accessor, createComputed, createContext, createEffect, createMemo, ParentProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { useDrawerStore } from "../drawer.store";
import { useEditorStore } from "../editor.store";
import { isInsideRect } from "../helpers";
import { AnyBlock, Dimension, Point } from "../types/blocks";
import { EditType } from "../types/editor";

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

   blockData: BlockData;

   block: B;
   shadowed: boolean;
};


const BlockContext = createContext<[BlockContextValues, BlockContextHandlers]>();

type BlockStoreProviderProps = ParentProps<{
   block: AnyBlock;
   shadowed?: boolean;
}>;
// TODO: refactor this
export function BlockStoreProvider(props: BlockStoreProviderProps) {
   const blockData = new BlockData();
   const [editor, {
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
   const [drawerStore] = useDrawerStore();
   const [state, setState] = createStore<BlockContextValues>({
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
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

   const isMeEditing = createMemo(() => editor.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && editor.editingType === EditType.Drag);
   const isMeResizing = createMemo(() => isMeEditing() && editor.editingType === EditType.Resize);
   const isEditingContent = createMemo(() => isMeEditing() && editor.editingType === EditType.Content);
   const isMeOverflowing = createMemo(() => editor.overflowedBlocks.includes(props.block));
   const isMeEditingByRoommate = createMemo(() => editor.rommates.find(rm => app.name !== rm.name && rm.workingBlockId === props.block.id));

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
      blockData.pointerDown = true;
      if (e.button !== btn) {
         return;
      }
      handyWasClicked = handy;
      const box = blockData.boxRef.getBoundingClientRect();

      const body = document.body;
      blockData.relX = e.pageX - (box.left + body.scrollLeft - body.clientLeft);
      blockData.relY = e.pageY - (box.top + body.scrollTop - body.clientTop);

      onChangeStart(props.block, state.transform, EditType.Drag);

      blockData.boxRef.onpointermove = onBoxPointerMove;
      blockData.boxRef.onpointerup = onBoxPointerUp;
      blockData.boxRef.setPointerCapture(e.pointerId);
   }

   function onBoxPointerMove(e: PointerEvent) {
      const x = e.pageX - blockData.relX - staticEditorData.containerRect.x;
      const y = e.pageY - blockData.relY - staticEditorData.containerRect.y;
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
      blockData.pointerDown = false;
      blockData.boxRef.onpointermove = null;
      blockData.boxRef.onpointerup = null;
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
         console.log(editor.showContextMenu);
      }
      wasBlockMoved = false;
   }

   function onHookPointerDown(e: PointerEvent, side: CursorSide) {
      if (e.button !== 0) return;
      if (isMeEditingByRoommate()) return;
      blockData.relX = e.pageX;
      blockData.relY = e.pageY;

      blockData.capturingSide = side;

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
      switch (blockData.capturingSide) {
         case CursorSide.W: {
            const xc = e.pageX - containerRect.x;
            width += x - xc;
            x = xc;

            εX = editor.document.layoutOptions.gap;
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

            εY = editor.document.layoutOptions.gap;
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

            εY = editor.document.layoutOptions.gap;
            εX = editor.document.layoutOptions.gap;
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
      onChange(props.block, { x, y, width, height }, EditType.Resize);
   }

   function onDotPointerUp(e: PointerEvent) {
      const dot = e.currentTarget as HTMLDivElement;
      dot.releasePointerCapture(e.pointerId);
      dot.onpointermove = null;
      dot.onpointerup = null;
      blockData.capturingSide = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, EditType.Resize);
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
         isMeEditingByRoommate,
         isEditingContent,
         onBoxClick,
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
