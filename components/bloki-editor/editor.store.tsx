import { Accessor, batch, createContext, createMemo, PropsWithChildren, splitProps, useContext } from "solid-js";
import { createStore, DeepReadonly, unwrap } from "solid-js/store";
import { Block, BlokiDocument } from "../../lib/entities";

type Point = { x: number, y: number; };
type EditorStoreValues = DeepReadonly<{
   draggingItem: Block | null;
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
   onDragStart: (block: Block, absX: number, absY: number) => void;
   onDrag: (block: Block, absX: number, absY: number) => void;
   onDragEnd: (block: Block, absX: number, absY: number) => void;
   isDragging: Accessor<boolean>;
   gridSize: (factor: number) => number;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition: (absX: number, absY: number) => Point;
   getAbsolutePosition: (x: number, y: number) => Point;
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
         draggingItem: null,
         isPlacementCorrect: false,
         projection: [],
         // document: null,
         // lastDocumentId: null,
         document: unwrap(props.document),
      }
   );

   const isDragging = createMemo(() => state.draggingItem != null);

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

   function onDragStart(block: Block, absX: number, absY: number) {
      setState('draggingItem', block);
   }
   function isProjectionsEquals(p1, p2) {
      if (!p1 || !p2) return false;
      if (p1.length !== p2.length) return false;

      let result = true;
      for (let i = 0; i < p1.length; i++) {
         if (p1[i].x !== p2[i].x || p1[i].y !== p2[i].y) {
            result = false;
            break;
         }
      }
      return result;
   }
   function onDrag(block: Block, absX: number, absY: number) {
      const { x, y } = getRelativePosition(absX, absY);
      const oldStartPoint = state.projection[0];
      if (oldStartPoint?.x === x && oldStartPoint?.y === y) {
         return;
      }
      const projection = [];
      for (let w = 0; w < 12; w++) {
         for (let h = 0; h < 12; h++) {
            projection.push({ x: x + w, y: y + h });
         }
      }
      setState('projection', projection);
   }

   function onDragEnd(block: Block, absX: number, absY: number) {
      const { x, y } = getRelativePosition(absX, absY);
      batch(() => {
         setState('draggingItem', null);
         setState('document', 'blocks', state.document.blocks.indexOf(block), { x, y });
      });
   }
   return (
      <EditorStore.Provider value={[
         state,
         {
            onDragStart,
            onDrag,
            onDragEnd,
            isDragging,
            gridSize,
            realSize,
            getRelativePosition,
            getAbsolutePosition,
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
