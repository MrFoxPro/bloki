import { createContext, PropsWithChildren, useContext } from "solid-js";

type Block = {

}

type Layout = {

}
const initialState = [
   {
      isDragging: false as boolean,
      draggingItem: null as Block | null,
      isPlacementCorrect: true as boolean,
      projection: new Set<number>() as Set<number>,
      projectionSlotId: '' as string,
      layout: {} as Layout,
      updater: true as boolean,
   },
   {
      onDragStart(block: Block, slotId: string, absX: number, absY: number) { },
      onDrag(block: Block, slotId: string, absX: number, absY: number) { },
      onDragEnd(block: Block, slotId: string, absX: number, absY: number) { },
      force() { },
   },
] as const;


const EditorContext = createContext(initialState);

export function EditorStoreProvider(props: PropsWithChildren<{}>) {


   return <EditorContext.Provider value={ }>{props.children}</EditorContext.Provider>
}
export const useEditorStore = () => useContext(EditorStore)