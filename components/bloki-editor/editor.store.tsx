import type { Expand } from 'type-expand';
import { Accessor, createContext, createMemo, mergeProps, PropsWithChildren, useContext } from "solid-js";
import { createStore, DeepReadonly } from "solid-js/store";
import { Block } from "./entities";
import { testLayout1 } from "./test";

const EditorStore = createContext([
   {
      draggingItem: null as Block | null,
      isPlacementCorrect: true as boolean,
      projection: new Set<number>() as Set<number>,
      layout: testLayout1 as DeepReadonly<Block[]>,
      updater: true as boolean,
   },
   {
      onDragStart(block: Block, absX: number, absY: number) { },
      onDrag(block: Block, absX: number, absY: number) { },
      onDragEnd(block: Block, absX: number, absY: number) { },
      force() { },
      isDragging: (() => false) as Accessor<boolean>,
   }
] as const);

type EditorStoreProviderProps = Expand<PropsWithChildren<{

}> & Pick<typeof EditorStore['defaultValue'][0], 'layout'>>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   const [state, setState] = createStore(mergeProps(EditorStore.defaultValue[0], props));
   const isDragging = createMemo(() => state.draggingItem != null);

   function getRelativePosition() {

   }

   function onDragStart(block: Block, absX: number, absY: number) {
      setState({
         draggingItem: block,
      });
   }
   function onDrag(block: Block, absX: number, absY: number) {

   }
   function onDragEnd(block: Block, absX: number, absY: number) {
      setState({
         draggingItem: null,
      });
   }
   function force() {
      setState('updater', !state.updater);
   }

   return (
      <EditorStore.Provider value={[state, { onDragStart, onDrag, onDragEnd, force, isDragging }] as const}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
