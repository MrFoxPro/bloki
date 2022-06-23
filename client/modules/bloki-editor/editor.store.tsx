import { Accessor, batch, createComputed, createContext, createMemo, mergeProps, ParentProps, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import {
   AnyBlock,
   BlockTransform,
   Dimension,
   PlacementStatus,
   Point
} from "./types/blocks";
import { EditType, Instrument } from "./types/editor";
import { Roommate } from "@/lib/network.types";
import { BlokiDocument } from '@/lib/schema.auto';

type EditorStoreValues = {
   editingBlock: AnyBlock | null;
   editingType: EditType | null;
   selectedBlocks: AnyBlock[];
   overflowedBlocks: AnyBlock[];
   isPlacementCorrect: boolean;
   document: BlokiDocument;
   layout: AnyBlock[];
   showContextMenu: boolean;
   rommates: Roommate[];
   cursor: Point;
   connected: boolean;
};

type CalculatedSize = {
   gap_px: string;
   size_px: string;
   sum_px: string;
   fGridWidth: number;
   fGridHeight: number;
   mGridWidth: number;
   mGridHeight: number;
   fGridWidth_px: string;
   fGridHeight_px: string;
   mGridWidth_px: string;
   mGridHeight_px: string;
};

type ChangeHandler = (block: AnyBlock, absTransform: BlockTransform, type: EditType) => void;

type EditorStoreHandles = {
   onChangeStart: ChangeHandler;
   onChange: ChangeHandler;
   onChangeEnd: ChangeHandler;
   gridSize(factor: number): number;
   gridBoxSize: Accessor<number>;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;
   getRelativeSize(width: any, height: any, roundFunc?: (x: number) => number): Dimension;
   getAbsoluteSize(width: number, height: number): Dimension;
   checkPlacement(block: BlockTransform, x?: number, y?: number, width?: number, height?: number): PlacementStatus;
   selectBlock(block: AnyBlock, type?: EditType): void;
   deleteBlock(block: AnyBlock): void;
   setEditorState: SetStoreFunction<EditorStoreValues>;
};

const EditorContext = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = ParentProps<{
   document: BlokiDocument;
   instrument?: Instrument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   props = mergeProps({
      instrument: Instrument.Cursor
   }, props);

   const [editorState, setEditorState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
         showContextMenu: false,
         overflowedBlocks: [],
         isPlacementCorrect: false,
         document: null,
         layout: [],
         rommates: [],
         cursor: { x: 0, y: 0 },
         connected: false,
         placement: null,
      }
   );

   createComputed(() => {
      setEditorState({
         document: props.document,
         layout: props.document.layout
      });
   });

   const gridBoxSize = createMemo(() => editorState.document.layoutOptions.gap + editorState.document.layoutOptions.size);

   function gridSize(factor: number) {
      if (factor <= 0) return 0;
      return factor * (editorState.document.layoutOptions.size + editorState.document.layoutOptions.gap) - editorState.document.layoutOptions.gap;
   }

   const realSize = createMemo(() => {
      const cellPx = {
         gap_px: editorState.document.layoutOptions.gap + 'px',
         size_px: editorState.document.layoutOptions.size + 'px',
         sum_px: (editorState.document.layoutOptions.size + editorState.document.layoutOptions.gap) + 'px'
      };
      const dimensionsKeys = ['fGridWidth', 'fGridHeight', 'mGridWidth', 'mGridHeight'];
      const grid = dimensionsKeys.reduce((prev, curr) => ({ ...prev, [curr]: gridSize(editorState.document.layoutOptions[curr]) }), {});
      const gridPx = dimensionsKeys.reduce((prev, curr) => ({ ...prev, [curr + '_px']: (grid[curr] + 'px') }), {});
      return { ...cellPx, ...grid, ...gridPx } as CalculatedSize;
   });


   function getRelativePosition(absX: number, absY: number) {
      const x = Math.floor(absX / gridBoxSize());
      const y = Math.floor(absY / gridBoxSize());
      return { x, y };
   }

   function getAbsolutePosition(x: number, y: number) {
      return { x: x * gridBoxSize(), y: y * gridBoxSize() };
   }

   function getRelativeSize(width: number, height: number, roundFunc = Math.ceil) {
      return {
         width: roundFunc(width / gridBoxSize()),
         height: roundFunc(height / gridBoxSize())
      };
   }

   function getAbsoluteSize(width: number, height: number) {
      return { width: gridSize(width), height: gridSize(height) };
   }
   function checkPlacement(block: AnyBlock, x = block.x, y = block.y, width = block.width, height = block.height): PlacementStatus {
      const intersections: BlockTransform[] = [];
      const affected: AnyBlock[] = [];
      let correct = true;
      let outOfBorder = false;

      const { fGridHeight, fGridWidth, blockMinSize, blockMaxSize } = editorState.document.layoutOptions;

      if (width > blockMaxSize.width || width < blockMinSize.width || height > blockMaxSize.height || height < blockMinSize.height) {
         correct = false;
         outOfBorder = true;
      }

      // TODO: different grid sizes?
      if (x < 0 || y < 0 || y + height > fGridHeight || x + width > fGridWidth) {
         correct = false;
         outOfBorder = true;
      }

      for (let i = 0; i < editorState.document.layout.length; i++) {
         const sBlock = editorState.document.layout[i];
         if (sBlock.id === block.id) continue;

         const x1 = x;
         const y1 = y;
         const sizeX1 = width;
         const sizeY1 = height;

         const x2 = sBlock.x;
         const y2 = sBlock.y;
         const sizeX2 = sBlock.width;
         const sizeY2 = sBlock.height;

         const dx = x2 - x1;
         const dy = y2 - y1;

         const colXDist = dx > 0 ? sizeX1 : sizeX2;
         const colYDist = dy > 0 ? sizeY1 : sizeY2;

         const adx = Math.abs(dx);
         const ady = Math.abs(dy);

         if (adx < colXDist && ady < colYDist) {
            correct = false;
            affected.push(sBlock);
            const startX = Math.max(x1, x2);
            const startY = Math.max(y1, y2);

            const xEnd = Math.min(x1 + sizeX1, x2 + sizeX2);
            const yEnd = Math.min(y1 + sizeY1, y2 + sizeY2);

            intersections.push({
               x: startX,
               width: xEnd - startX,
               y: startY,
               height: yEnd - startY,
            });
         }
      }
      return {
         correct,
         intersections,
         outOfBorder,
         affected
      };
   }

   function onChangeStart(block: AnyBlock, abs: BlockTransform, type: EditType) {
      setEditorState({ editingBlock: block, editingType: type });
      const relTransform = { height: block.height, width: block.width, x: block.x, y: block.y };
      // staticEditorData.emit('changestart', block, {
      //    absTransform: abs,
      //    placement: { correct: true, intersections: [], outOfBorder: false, affected: [] },
      //    relTransform,
      //    type
      // });
   }

   function onChange(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);

      const placement = checkPlacement(block, x, y, width, height);
      setEditorState({ isPlacementCorrect: placement.correct, overflowedBlocks: placement.affected, placement });
      // staticEditorData.emit('change', block, {
      //    absTransform,
      //    placement,
      //    relTransform: { x, y, width, height },
      //    type
      // });
   }

   function onChangeEnd(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);
      const placement = checkPlacement(block, x, y, width, height);
      // const relTransofrm = { x, y, width, height };
      batch(() => {
         setEditorState({
            editingBlock: null,
            editingType: EditType.Select,
            isPlacementCorrect: true,
            overflowedBlocks: [],
            placement: null
         });

         if (placement.correct) {
            setEditorState('layout', editorState.layout.indexOf(block), { x, y, width, height });
            // send(WSMsgType.ChangeEnd, { block, rel: relTransofrm, type });
            return;
         }
         setEditorState('layout', editorState.layout.indexOf(block), { x: block.x, y: block.y, width: block.width, height: block.height });
      });

      // staticEditorData.emit('changeend', block, {
      //    absTransform,
      //    placement,
      //    relTransform: { x, y, width, height },
      //    type
      // });
   }

   function selectBlock(selectedBlock: AnyBlock, type: EditType = EditType.Select) {
      if (selectedBlock) {
         setEditorState({
            editingBlock: selectedBlock,
            editingType: type,
         });
      }
      else {
         setEditorState({
            editingBlock: null,
            editingType: null,
         });
      }
   }
   function deleteBlock(block: AnyBlock) {
      if (editorState.editingBlock === block) {
         setEditorState({
            editingBlock: null,
            editingType: null
         });
      }
      setEditorState('layout', blocks => blocks.filter(b => b.id !== block.id));
      // send(WSMsgType.DeleteBlock, block.id);
   }

   return (
      <EditorContext.Provider value={[
         editorState,
         {
            onChangeStart,
            onChange,
            onChangeEnd,
            checkPlacement,
            gridSize,
            realSize,
            gridBoxSize,
            getRelativePosition,
            getAbsolutePosition,
            getAbsoluteSize,
            getRelativeSize,

            selectBlock,
            deleteBlock,
            setEditorState,
         }
      ]}>
         {props.children}
      </EditorContext.Provider>
   );
}

export const useEditorContext = () => useContext(EditorContext);
