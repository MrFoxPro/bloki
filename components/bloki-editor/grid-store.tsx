import { createContext, PropsWithChildren, useContext } from "solid-js";
import { createStore, DeepReadonly } from "solid-js/store";
import { Block } from "./entities";
import { testLayout1 } from "./test";

const EditorStore = createContext([
   {
      isDragging: false as boolean,
      draggingItem: null as Block | null,
      isPlacementCorrect: true as boolean,
      projection: new Set<number>() as Set<number>,
      projectionSlotId: '' as string,
      layout: testLayout1 as DeepReadonly<Block[]>,
      updater: true as boolean,
   },
   {
      onDragStart(block: Block, slotId: string, absX: number, absY: number) { },
      onDrag(block: Block, slotId: string, absX: number, absY: number) { },
      onDragEnd(block: Block, slotId: string, absX: number, absY: number) { },
      force() { },
   },
] as const);

export function EditorStoreProvider(props: PropsWithChildren<{}>) {
   const [state, setState] = createStore(EditorStore.defaultValue[0]);
   const context = [
      state,
      {
         onDragStart(block: Block, slotId: string, absX: number, absY: number) {
            setState({
               draggingItem: block,
               isDragging: true
            });
         },
         onDrag() {
            console.log('dragging!');
         },
         onDragEnd() {
            setState({
               draggingItem: null,
               isDragging: false
            });
         },
         force() {
            setState('updater', !state.updater);
         }
      }
   ] as const;
   return <EditorStore.Provider value={context}>{props.children}</EditorStore.Provider>;
}
export const useEditorStore = () => useContext(EditorStore);
