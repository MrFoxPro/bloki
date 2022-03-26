import { Accessor, batch, createContext, createMemo, PropsWithChildren, useContext } from "solid-js";
import { createStore, DeepReadonly, SetStoreFunction, unwrap } from "solid-js/store";
import { AnyBlock, BlokiDocument } from "@/lib/entities";
import { createNanoEvents, Emitter } from 'nanoevents';

export type Point = { x: number, y: number; };
export type Dimension = { width: number, height: number; };
export type EditType = 'drag' | 'resize' | 'select' | 'content';

export type BlockTransform = Point & Dimension;

type EditorStoreValues = DeepReadonly<{
   editingBlock: AnyBlock | null;
   editingType: EditType | null;

   selectedBlocks: AnyBlock[];

   isPlacementCorrect: boolean;
   document: BlokiDocument;

   containerRect?: DOMRect;
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


type ChangeHandler = (block: AnyBlock, absTransform: BlockTransform, type: EditType) => void;

type EditorStoreHandles = {
   onChangeStart: ChangeHandler;
   onChange: ChangeHandler;
   onChangeEnd: ChangeHandler;

   onGridClick(e: MouseEvent & { currentTarget: HTMLDivElement; }, type: 'main' | 'foreground'): void;
   onTextBlockClick(block: AnyBlock): void;
   selectBlock(block: AnyBlock, type?: EditType): void;

   gridSize(factor: number): number;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;

   getAbsoluteSize(width: number, height: number): Dimension;

   setStore: SetStoreFunction<EditorStoreValues>;

   emitter: Emitter<EditorEvents>;
};

export type Intersection = {
   startX: number;
   width: number;
   startY: number;
   height: number;
};
export type PlacementStatus = {
   correct: boolean;
   intersections: Intersection[];
   outOfBorder: boolean;
};

type ChangeEventInfo = {
   type: EditType;
   absTransform: BlockTransform;
   relTransform: BlockTransform;
   placement: PlacementStatus;
};
interface EditorEvents {
   change: (block: AnyBlock, stage: 'start' | 'change' | 'end', changeInfo: ChangeEventInfo) => void;
}

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const emitter = createNanoEvents<EditorEvents>();
   const [state, setState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
         isPlacementCorrect: false,
         containerRect: null,
         document: unwrap(props.document),
      }
   );

   const gridBoxSize = createMemo(() => state.document.layoutOptions.gap + state.document.layoutOptions.size);

   function gridSize(factor: number) {
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

   function getAbsoluteSize(width: number, height: number) {
      return { width: gridSize(width), height: gridSize(height) };
   }

   const BLOCK_MIN_WIDTH = 1;
   const BLOCK_MIN_HEIGHT = 1;

   const BLOCK_MAX_WIDTH = 45;
   const BLOCK_MAX_HEIGHT = 45;

   // const minBlockSize = createMemo(() => getAbsoluteSize(1, 1));
   // const maxBlockSize = createMemo(() => getAbsoluteSize(BLOCK_MAX_WIDTH, BLOCK_MAX_HEIGHT));

   function checkPlacement(block: BlockTransform, x: number, y: number, width = block.width, height = block.height) {
      const intersections: Intersection[] = [];
      let correct = true;
      let outOfBorder = false;
      if (width > BLOCK_MAX_WIDTH || width < BLOCK_MIN_WIDTH || height > BLOCK_MAX_HEIGHT || height < BLOCK_MIN_HEIGHT) {
         correct = false;
         outOfBorder = true;
      }

      // TODO: different grid sizes?
      const { fGridHeight, fGridWidth } = state.document.layoutOptions;
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
            let miniX = 0, miniY = 0;
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

   function getRelativeSize(width, height, roundFunc = Math.ceil) {
      return {
         width: roundFunc(width / gridBoxSize()),
         height: roundFunc(height / gridBoxSize())
      };
   }

   function onChangeStart(block: AnyBlock, abs: BlockTransform, type: EditType) {
      setState({ editingBlock: block, editingType: type });

      emitter.emit('change', block, 'start', {
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
      if (type === 'resize') {
         absTransform.height += state.document.layoutOptions.gap;
         absTransform.width += state.document.layoutOptions.gap;
      }
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);
      if (type === 'resize' && x === block.x && y === block.y && height === block.height && width === block.width) {
         return;
      }

      const placement = checkPlacement(block, x, y, width, height);
      setState({ isPlacementCorrect: placement.correct });
      emitter.emit('change', block, 'change', {
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

      emitter.emit('change', block, 'end', {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function isInMainGrid(x: number) {
      const { mGridWidth, fGridWidth } = state.document.layoutOptions;
      const start = (fGridWidth - mGridWidth) / 2;
      const end = start + mGridWidth;
      return x >= start && x < end;
   }

   function onGridClick(e: MouseEvent & { currentTarget: HTMLDivElement; }, grid: 'main' | 'foreground') {
      if (state.editingBlock) {
         selectBlock(null);
         return;
      }

      let { x, y } = getRelativePosition(e.pageX - state.containerRect.x, e.pageY - state.containerRect.y);

      if (grid === 'main') {
         const { mGridWidth, fGridWidth } = state.document.layoutOptions;
         x = (fGridWidth - mGridWidth) / 2;
      }
      else return;

      const newBlockTransform: BlockTransform = {
         height: 1,
         width: state.document.layoutOptions.mGridWidth,
         x, y
      };
      if (checkPlacement(newBlockTransform, x, y).correct) {
         const newBlock: AnyBlock = {
            id: crypto.randomUUID(),
            type: 'text',
            ...newBlockTransform
         };
         setState('document', 'blocks', blocks => [...blocks, newBlock]);
         const block = state.document.blocks.find(x => x.id === newBlock.id);
         setState({
            editingBlock: block,
            editingType: 'content'
         });
      }
   }

   function onTextBlockClick(block: AnyBlock) {
      if (state.editingBlock !== block) {
         setState({
            editingBlock: null,
            editingType: null,
         });

      }
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

   return (
      <EditorStore.Provider value={[
         state,
         {
            onChangeStart,
            onChange,
            onChangeEnd,
            onGridClick,
            onTextBlockClick,
            selectBlock,
            gridSize,
            realSize,
            getRelativePosition,
            getAbsolutePosition,
            getAbsoluteSize,

            setStore: setState,
            emitter,
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
