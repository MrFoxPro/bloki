import type { Expand } from 'type-expand';
import { Accessor, createContext, createMemo, PropsWithChildren, splitProps, useContext } from "solid-js";
import { createStore, DeepReadonly } from "solid-js/store";
import { Block, BlokiDocument } from "./entities";

type EditorStoreValues = {
   readonly draggingItem: Block | null;
   readonly isPlacementCorrect: boolean;
   readonly projection: Set<number>;
   readonly document: DeepReadonly<BlokiDocument>;
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

class EditorStoreLocker {
   private _callbacks: Set<Function> = new Set<Function>();
   public lock() {
      this._callbacks.forEach((cb) => cb());
   }
   public addLockListener(cb: Function) {
      if (this._callbacks.has(cb)) {
         console.warn('This callback already registered', cb);
         return;
      }
      this._callbacks.add(cb);
   }
   public removeLockListener(cb: Function) {
      this._callbacks.delete(cb);
   }
   public dispose() {
      this._callbacks.clear();
   }
}

type EditorStoreHandles = {
   readonly onDragStart: (block: Block, absX: number, absY: number) => void;
   readonly onDrag: (block: Block, absX: number, absY: number) => void;
   readonly onDragEnd: (block: Block, absX: number, absY: number) => void;
   readonly isDragging: Accessor<boolean>;
   readonly gridSize: (factor: number) => number;
   readonly realSize: Accessor<CalculatedSize>;
   readonly locker: EditorStoreLocker;
};

export type EditorStoreEvents = 'lock';

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = Expand<PropsWithChildren<{

}> & Pick<typeof EditorStore['defaultValue'][0], 'document'>>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const [local, others] = splitProps(props, ['children']);
   const [state, setState] = createStore<EditorStoreValues>(
      {
         draggingItem: null,
         isPlacementCorrect: false,
         projection: new Set<number>(),
         document: null,
         ...others
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
      return [x, y] as const;
   }
   function getAbsolutePosition(x: number, y: number) {
      return [x * gridBoxSize(), y * gridBoxSize()] as const;
   }

   function onDragStart(block: Block, absX: number, absY: number) {
      setState('draggingItem', block);
   }
   function onDrag(block: Block, absX: number, absY: number) {
      const [x, y] = getRelativePosition(absX, absY);

      const square = block.width * block.height;
      const projection = new Set<number>();
      // const startCellId =
      for (let i = 0; i < square; i++) {
         // let cellId =
         // projection.add()
      }
   }
   function onDragEnd(block: Block, absX: number, absY: number) {
      const [x, y] = getRelativePosition(absX, absY);
      setState('draggingItem', null);
   }

   const locker = new EditorStoreLocker();
   const context: [EditorStoreValues, EditorStoreHandles] = [
      state,
      {
         onDragStart,
         onDrag,
         onDragEnd,
         isDragging,
         gridSize,
         realSize,
         locker,
      }
   ];
   return (
      <EditorStore.Provider value={context}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
