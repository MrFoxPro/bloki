import { Accessor, batch, createComputed, createContext, createMemo, mergeProps, PropsWithChildren, useContext } from "solid-js";
import { createNanoEvents, Emitter } from 'nanoevents';
import { createStore, DeepReadonly, SetStoreFunction } from "solid-js/store";
import {
   AnyBlock,
   BlockTransform,
   Dimension,
   EditType,
   Instrument,
   PlacementStatus,
   Point
} from "./types";
import { BlokiDocument } from "@/lib/entities";

type EditorStoreValues = DeepReadonly<{
   editingBlock?: AnyBlock;
   editingType?: EditType;

   selectedBlocks: AnyBlock[];
   overflowedBlocks: AnyBlock[];
   isPlacementCorrect: boolean;
   document: BlokiDocument;

   showContextMenu: boolean;
}>;

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

type ChangeEventInfo = {
   type: EditType;
   absTransform: BlockTransform;
   relTransform: BlockTransform;
   placement: PlacementStatus;
};

interface EditorEvents {
   changestart(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   change(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   changeend(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   containerrectchanged(rect: DOMRect): void;
   maingridcursormoved(block: BlockTransform, isOut: boolean): void;
}

class StaticEditorData {
   private emitter: Emitter<EditorEvents>;
   public containerRect: DOMRect;
   constructor() {
      this.emitter = createNanoEvents<EditorEvents>();
   }

   on<E extends keyof EditorEvents>(event: E, callback: EditorEvents[E]) {
      return this.emitter.on(event, callback);
   }

   emit<K extends keyof EditorEvents>(event: K, ...args: Parameters<EditorEvents[K]>) {
      return this.emitter.emit(event, ...args);
   }
}

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

   setEditorStore: SetStoreFunction<EditorStoreValues>;
   staticEditorData: StaticEditorData;
};

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
   instrument?: Instrument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   props = mergeProps({
      instrument: Instrument.Cursor
   }, props);

   const staticEditorData = new StaticEditorData();

   const [state, setState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
         showContextMenu: false,
         overflowedBlocks: [],
         isPlacementCorrect: false,
         document: null,
      }
   );

   createComputed(() => {
      setState({
         document: props.document
      });
   });

   const gridBoxSize = createMemo(() => state.document.layoutOptions.gap + state.document.layoutOptions.size);

   function gridSize(factor: number) {
      if (factor <= 0) return 0;
      return factor * (state.document.layoutOptions.size + state.document.layoutOptions.gap) - state.document.layoutOptions.gap;
   }

   const realSize = createMemo(() => {
      const cellPx = {
         gap_px: state.document.layoutOptions.gap + 'px',
         size_px: state.document.layoutOptions.size + 'px',
         sum_px: (state.document.layoutOptions.size + state.document.layoutOptions.gap) + 'px'
      };
      const dimensionsKeys = ['fGridWidth', 'fGridHeight', 'mGridWidth', 'mGridHeight'];
      const grid = dimensionsKeys.reduce((prev, curr) => ({ ...prev, [curr]: gridSize(state.document.layoutOptions[curr]) }), {});
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

   function getRelativeSize(width, height, roundFunc = Math.ceil) {
      return {
         width: roundFunc(width / gridBoxSize()),
         height: roundFunc(height / gridBoxSize())
      };
   }

   function getAbsoluteSize(width: number, height: number) {
      return { width: gridSize(width), height: gridSize(height) };
   }

   function checkPlacement(block: BlockTransform, x = block.x, y = block.y, width = block.width, height = block.height): PlacementStatus {
      const intersections: BlockTransform[] = [];
      const affected: AnyBlock[] = [];
      let correct = true;
      let outOfBorder = false;

      const { fGridHeight, fGridWidth, blockMinSize, blockMaxSize } = state.document.layoutOptions;

      if (width > blockMaxSize.width || width < blockMinSize.width || height > blockMaxSize.height || height < blockMinSize.height) {
         correct = false;
         outOfBorder = true;
      }

      // TODO: different grid sizes?
      if (x < 0 || y < 0 || y + height > fGridHeight || x + width > fGridWidth) {
         correct = false;
         outOfBorder = true;
      }

      for (let i = 0; i < state.document.blocks.length; i++) {
         const sBlock = state.document.blocks[i];
         if (sBlock === block) continue;

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
            // continue;
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
      setState({ editingBlock: block, editingType: type });

      const relTransform = { height: block.height, width: block.width, x: block.x, y: block.y };
      staticEditorData.emit('changestart', block, {
         absTransform: abs,
         placement: { correct: true, intersections: [], outOfBorder: false, affected: [] },
         relTransform,
         type
      });
   }

   function onChange(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      if (type === 'drag' && x === block.x && y === block.y) {
         return;
      }
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);

      // if (type === 'resize' && x === block.x && y === block.y && height === block.height && width === block.width) {
      //    return;
      // }

      if (type === 'content') {

      }

      const placement = checkPlacement(block, x, y, width, height);
      setState({ isPlacementCorrect: placement.correct, overflowedBlocks: placement.affected });
      staticEditorData.emit('change', block, {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function onChangeEnd(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);
      const placement = checkPlacement(block, x, y, width, height);

      batch(() => {
         setState({
            // editingBlock: null,
            editingType: 'select',
            isPlacementCorrect: true,
            overflowedBlocks: [],
         });

         if (placement.correct) {
            setState('document', 'blocks', state.document.blocks.indexOf(block), { x, y, width, height });
            return;
         }
         console.log('incorrect!');
         setState('document', 'blocks', state.document.blocks.indexOf(block), { x: block.x, y: block.y, width: block.width, height: block.height });
      });

      staticEditorData.emit('changeend', block, {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function selectBlock(selectedBlock: AnyBlock, type: EditType = 'select') {
      if (selectedBlock) {
         setState({
            editingBlock: selectedBlock,
            editingType: type,
         });
      }
      else {
         setState({
            editingBlock: null,
            editingType: null,
         });
      }
   }
   function deleteBlock(block: AnyBlock) {
      if (state.editingBlock === block) {
         setState({
            editingBlock: null,
            editingType: null
         });
      }
      setState('document', 'blocks', blocks => blocks.filter(b => b.id !== block.id));
   }

   // let verticallySortedDocs: string[];
   // createEffect(() => {

   // })

   return (
      <EditorStore.Provider value={[
         state,
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

            setEditorStore: setState,
            staticEditorData
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
