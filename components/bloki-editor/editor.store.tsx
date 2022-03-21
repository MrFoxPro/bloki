import { Accessor, batch, createContext, createMemo, PropsWithChildren, splitProps, useContext } from "solid-js";
import { createStore, DeepReadonly, SetStoreFunction, unwrap } from "solid-js/store";
import { AnyBlock, BlokiDocument } from "../../lib/entities";

type Point = { x: number, y: number; };
type Dimension = { width: number, height: number; };
type EditingType = 'drag' | 'resize' | 'select' | 'content';


type EditorStoreValues = DeepReadonly<{
   editingBlock: AnyBlock | null;
   editingType: EditingType | null;
   isPlacementCorrect: boolean;
   projection: Point[];
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
type EditorStoreHandles = {

   onDragStart(block: AnyBlock, absX: number, absY: number): void;
   onDrag(block: AnyBlock, absX: number, absY: number): void;
   onDragEnd(block: AnyBlock, absX: number, absY: number): void;

   onGridDblClick(e: MouseEvent & { currentTarget: HTMLDivElement; }): void;
   onTextBlockClick(block: AnyBlock): void;
   selectBlock(block: AnyBlock): void;

   gridSize(factor: number): number;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;

   getAbsoluteSize(width: number, height: number): Dimension;

   setStore: SetStoreFunction<EditorStoreValues>;
};

export type EditorStoreEvents = 'lock';

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const [local, others] = splitProps(props, ['children']);
   const [state, setState] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         isPlacementCorrect: false,
         projection: [],
         // document: null,
         // lastDocumentId: null,
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
   function onDragStart(draggingBlock: AnyBlock, absX: number, absY: number) {
      setState({ editingBlock: draggingBlock, editingType: 'drag' });
   }

   function checkIfPlacementCorrect(block: AnyBlock, x: number, y: number) {
      const { fGridHeight, fGridWidth } = state.document.layoutOptions;
      // TODO: different grid sizes?
      if (x < 0 || y < 0 || y + block.height > fGridHeight || x + block.width > fGridWidth) {
         return false;
      }
      for (let i = 0; i < state.document.blocks.length; i++) {
         const sBlock = state.document.blocks[i];
         if (!sBlock) console.warn('wut');
         if (sBlock === block) continue;

         const x1 = x;
         const y1 = y;
         const sizeX1 = block.width;
         const sizeY1 = block.height;

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
   function onDrag(block: AnyBlock, absX: number, absY: number) {
      const { x, y } = getRelativePosition(absX, absY);
      const oldStartPoint = state.projection[0];
      if (oldStartPoint?.x === x && oldStartPoint?.y === y) {
         return;
      }
      const projection = [];
      for (let w = 0; w < block.width; w++) {
         for (let h = 0; h < block.height; h++) {
            projection.push({ x: x + w, y: y + h });
         }
      }
      const isPlacementCorrect = checkIfPlacementCorrect(block, x, y);
      setState({ projection, isPlacementCorrect });
   }

   function onDragEnd(block: AnyBlock, absX: number, absY: number) {
      const { x, y } = getRelativePosition(absX, absY);
      const isPlacementCorrect = checkIfPlacementCorrect(block, x, y);
      batch(() => {
         setState({
            editingBlock: null,
            editingType: null,

            projection: [],
         });
         if (isPlacementCorrect) {
            setState('document', 'blocks', state.document.blocks.indexOf(block), { x, y });
         }
         else setState('document', 'blocks', state.document.blocks.indexOf(block), { x: block.x, y: block.y });
      });
   }
   function onGridDblClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      const { x, y } = getRelativePosition(e.offsetX, e.offsetY);
      console.log('dblclick', x, y);
      const newBlock: AnyBlock = {
         id: crypto.randomUUID(),
         height: 1,
         width: state.document.layoutOptions.mGridWidth,
         type: 'text',
         x, y
      };
      if (checkIfPlacementCorrect(newBlock, x, y)) {
         setState('document', 'blocks', blocks => [...blocks, newBlock]);
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

   function selectBlock(selectedBlock: AnyBlock) {
      if (selectedBlock) {
         setState({
            editingBlock: selectedBlock,
            editingType: 'select',
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
            onDragStart,
            onDrag,
            onDragEnd,
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
