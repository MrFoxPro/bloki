import { Accessor, batch, createComputed, createContext, createEffect, createMemo, PropsWithChildren, useContext } from "solid-js";
import { createNanoEvents, Emitter } from 'nanoevents';
import { createStore, DeepReadonly, SetStoreFunction, unwrap } from "solid-js/store";
import { AnyBlock, BlokiDocument } from "@/lib/entities";
import {
   BlockTransform,
   ChangeEventInfo,
   Dimension,
   EditType,
   Intersection,
   PlacementStatus,
   Point
} from "./types";

type EditorStoreValues = DeepReadonly<{
   editingBlock: AnyBlock | null;
   editingType: EditType | null;

   selectedBlocks: AnyBlock[];

   isPlacementCorrect: boolean;
   document: BlokiDocument;
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

interface EditorEvents {
   changestart(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   change(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   changeend(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   containerrectchanged(rect: DOMRect): void;
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
   selectBlock(block: AnyBlock, type?: EditType): void;
   gridSize(factor: number): number;
   gridBoxSize: Accessor<number>;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;
   getRelativeSize(width: any, height: any, roundFunc?: (x: number) => number): Dimension;
   getAbsoluteSize(width: number, height: number): Dimension;
   checkPlacement(block: BlockTransform, x: number, y: number, width?: number, height?: number): PlacementStatus;

   setStore: SetStoreFunction<EditorStoreValues>;
   editor: StaticEditorData;
};

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const editor = new StaticEditorData();

   const [state, setState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
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
      const size = state.document.layoutOptions.size;
      const gap = state.document.layoutOptions.gap;
      return factor * (size + gap) - gap;
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

   function checkPlacement(block: BlockTransform, x: number, y: number, width = block.width, height = block.height) {
      const intersections: Intersection[] = [];
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
         if (!sBlock) console.warn('wut');
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
            let startX = 0, startY = 0;
            if (dx > 0) {
               startX = x1 + adx;
            }
            else {
               startX = x2 + adx;
            }
            if (dy > 0) {
               startY = y1 + ady;
            }
            else {
               startY = y2 + ady;
            }

            let colWidth = colXDist - adx, colHeight = colYDist - ady;
            if (sizeX1 - adx - sizeX2 > 0) {
               if (dx < 0) colWidth = sizeX2 + dx;
               else colWidth = sizeX2;
            }
            if (sizeY1 - ady - sizeY2 > 0) {
               if (dy > 0) colHeight = sizeY2;
               else colHeight = sizeY2 + dy;
            }

            intersections.push({
               startX,
               width: colWidth,
               startY,
               height: colHeight,
            });
            continue;
         }
      }
      return {
         correct,
         intersections,
         outOfBorder
      };
   }

   function onChangeStart(block: AnyBlock, abs: BlockTransform, type: EditType) {
      setState({ editingBlock: block, editingType: type });

      editor.emit('changestart', block, {
         absTransform: abs,
         placement: { correct: true, intersections: [], outOfBorder: false, },
         relTransform: { height: block.height, width: block.width, x: block.x, y: block.y },
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
      setState({ isPlacementCorrect: placement.correct });
      editor.emit('change', block, {
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
         });
         if (placement.correct) {
            console.log('correct!');
            setState('document', 'blocks', state.document.blocks.indexOf(block), { x, y, width, height });
            return;
         }
         console.log('incorrect!');
         setState('document', 'blocks', state.document.blocks.indexOf(block), { x: block.x, y: block.y, width: block.width, height: block.height });
      });

      editor.emit('changeend', block, {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function createBlock(block: AnyBlock) {

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
            selectBlock,
            gridSize,
            realSize,
            gridBoxSize,
            getRelativePosition,
            getAbsolutePosition,
            getAbsoluteSize,
            getRelativeSize,

            setStore: setState,
            editor
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
