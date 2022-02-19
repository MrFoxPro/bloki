import type { Expand } from 'type-expand';
import { Accessor, createContext, createMemo, PropsWithChildren, useContext } from "solid-js";
import { createStore, DeepReadonly } from "solid-js/store";
import { Block, BlokiDocument } from "./entities";
import { testDocument1 } from "./test";

const EditorStore = createContext([
   {
      draggingItem: null as Block | null,
      isPlacementCorrect: true as boolean,
      projection: new Set<number>() as Set<number>,
      document: testDocument1 as DeepReadonly<BlokiDocument>,
      updater: true as boolean,
   },
   {
      onDragStart(block: Block, absX: number, absY: number) { },
      onDrag(block: Block, absX: number, absY: number) { },
      onDragEnd(block: Block, absX: number, absY: number) { },
      force() { },
      isDragging: (() => false) as Accessor<boolean>,
      gridSize: (() => undefined) as (factor: number) => number,
      realSize: (() => ({})) as Accessor<{
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
      }>,
   }
] as const);

type EditorStoreProviderProps = Expand<PropsWithChildren<{

}> & Pick<typeof EditorStore['defaultValue'][0], 'document'>>;


export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const [state, setState] = createStore({ ...EditorStore.defaultValue[0], ...props });

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
      const grid = {
         fGridWidth: gridSize(state.document.layoutOptions.fGridWidth),
         fGridHeight: gridSize(state.document.layoutOptions.fGridHeight),
         mGridWidth: gridSize(state.document.layoutOptions.mGridWidth),
         mGridHeight: gridSize(state.document.layoutOptions.mGridHeight),
      };
      const gridPX = {
         fGridWidth_px: grid.fGridWidth + 'px',
         fGridHeight_px: grid.fGridHeight + 'px',
         mGridWidth_px: grid.mGridWidth + 'px',
         mGridHeight_px: grid.mGridHeight + 'px',
      };
      return { ...cellPx, ...grid, ...gridPX };
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
   function force() {
      setState('updater', !state.updater);
   }

   return (
      <EditorStore.Provider value={[state, { onDragStart, onDrag, onDragEnd, force, isDragging, gridSize, realSize }] as const}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
