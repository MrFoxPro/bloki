import { Accessor, batch, createContext, createEffect, createMemo, PropsWithChildren, splitProps, useContext } from "solid-js";
import { createStore, DeepReadonly, SetStoreFunction, unwrap } from "solid-js/store";
import { AnyBlock, Block, BlokiDocument } from "../../lib/entities";

type Point = { x: number, y: number; };
type Dimension = { width: number, height: number; };
type EditingType = 'drag' | 'resize' | 'select' | 'content';

type BlockTransform = Point & Dimension;
type TransformType = 'drag' | 'resize';

type EditorStoreValues = DeepReadonly<{
   editingBlock: AnyBlock | null;
   editingType: EditingType | null;

   selectedBlocks: AnyBlock[];

   isPlacementCorrect: boolean;
   projection: Point[];
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
type EditorStoreHandles = {

   onChangeStart(block: AnyBlock, type: EditingType): void;
   onChange(block: AnyBlock, absTransform: BlockTransform, type: EditingType): void;
   onChangeEnd(block: AnyBlock, absTransform: BlockTransform, type: EditingType): void;

   onGridDblClick(e: MouseEvent & { currentTarget: HTMLDivElement; }): void;
   onTextBlockClick(block: AnyBlock): void;
   selectBlock(block: AnyBlock, type?: EditingType): void;

   gridSize(factor: number): number;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;

   getAbsoluteSize(width: number, height: number): Dimension;

   setStore: SetStoreFunction<EditorStoreValues>;

   minBlockSize: Accessor<Dimension>;
   maxBlockSize: Accessor<Dimension>;
};

export type EditorStoreEvents = 'lock';

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   // const [local, others] = splitProps(props, ['children']);
   const [state, setState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
         isPlacementCorrect: false,
         projection: [],
         containerRect: null,
         document: unwrap(props.document),
      }
   );

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

   const gridBoxSize = createMemo(() => state.document.layoutOptions.gap + state.document.layoutOptions.size);

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

   const minBlockSize = createMemo(() => getAbsoluteSize(1, 1));
   const maxBlockSize = createMemo(() => getAbsoluteSize(BLOCK_MAX_WIDTH, BLOCK_MAX_HEIGHT));

   function checkIfPlacementCorrect(block: BlockTransform, x: number, y: number, width = block.width, height = block.height) {
      const { fGridHeight, fGridWidth } = state.document.layoutOptions;

      if (width > BLOCK_MAX_WIDTH || width < BLOCK_MIN_WIDTH || height > BLOCK_MAX_HEIGHT || height < BLOCK_MIN_HEIGHT) {
         return false;
      }
      // TODO: different grid sizes?
      if (x < 0 || y < 0 || y + height > fGridHeight || x + width > fGridWidth) {
         return false;
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

         const colXDist = x2 - x1 > 0 ? sizeX1 : sizeX2;
         const colYDist = y2 - y1 > 0 ? sizeY1 : sizeY2;
         if (Math.abs(y2 - y1) < colYDist && Math.abs(x2 - x1) < colXDist) {
            return false;
         }
      }
      return true;
   }

   function getRelativeSize(width, height, roundFunc = Math.ceil) {
      return {
         width: roundFunc(width / gridBoxSize()),
         height: roundFunc(height / gridBoxSize())
      };
   }

   function onChangeStart(block: AnyBlock, type: EditingType) {
      setState({ editingBlock: block, editingType: type });
   }

   function onChange(block: AnyBlock, absTransform: BlockTransform, type: EditingType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      if (type === 'resize') {
         absTransform.height += state.document.layoutOptions.gap;
         absTransform.width += state.document.layoutOptions.gap;
      }
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);

      const oldNWPoint = state.projection[0];
      const oldSEPoint = state.projection[state.projection.length - 1];

      if (oldNWPoint?.x === x && oldNWPoint?.y === y &&
         oldSEPoint?.x === x + width - 1 && oldSEPoint?.y === y + height - 1) {
         return;
      }

      const projection = [];
      for (let h = 0; h < height; h++) {
         for (let w = 0; w < width; w++) {
            projection.push({ x: x + w, y: y + h });
         }
      }

      const isPlacementCorrect = checkIfPlacementCorrect(block, x, y, width, height);
      setState({ projection, isPlacementCorrect });
   }

   function onChangeEnd(block: AnyBlock, absTransform: BlockTransform) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);
      const isPlacementCorrect = checkIfPlacementCorrect(block, x, y, width, height);
      console.log('change end');
      batch(() => {
         setState({
            // editingBlock: null,
            editingType: 'select',
            projection: [],
         });
         if (isPlacementCorrect) {
            setState('document', 'blocks', state.document.blocks.indexOf(block), { x, y, width, height });
            return;
         }
         console.log('wrong placement');
         setState('document', 'blocks', state.document.blocks.indexOf(block), { x: block.x, y: block.y, width: block.width, height: block.height });
      });
   }

   // function isProjectionsEquals(p1: Point[], p2: Point[]) {
   //    if (!p1 || !p2) return false;
   //    if (p1.length !== p2.length) return false;

   //    let result = true;
   //    for (let i = 0; i < p1.length; i++) {
   //       if (p1[i].x !== p2[i].x || p1[i].y !== p2[i].y) {
   //          result = false;
   //          break;
   //       }
   //    }
   //    return result;
   // }

   function isInMainGrid(x: number) {
      const { mGridWidth, fGridWidth } = state.document.layoutOptions;
      const start = (fGridWidth - mGridWidth) / 2;
      const end = start + mGridWidth;
      return x >= start && x < end;
   }
   function onGridDblClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      let { x, y } = getRelativePosition(e.offsetX, e.offsetY);


      if (isInMainGrid(x)) {
         const { mGridWidth, fGridWidth } = state.document.layoutOptions;
         x = (fGridWidth - mGridWidth) / 2;
      }
      const newBlockDimension: BlockTransform = {
         height: 1,
         width: state.document.layoutOptions.mGridWidth,
         x, y
      };
      if (checkIfPlacementCorrect(newBlockDimension, x, y)) {
         const newBlock: AnyBlock = {
            id: crypto.randomUUID(),
            type: 'text',
            ...newBlockDimension
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

   function selectBlock(selectedBlock: AnyBlock, type: EditingType = 'select') {
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
            minBlockSize,
            maxBlockSize,
            onGridDblClick,
            onTextBlockClick,
            selectBlock,
            gridSize,
            realSize,
            getRelativePosition,
            getAbsolutePosition,
            getAbsoluteSize,
            setStore: setState,
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
