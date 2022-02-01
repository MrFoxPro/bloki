import { createContext, PropsWithChildren, useContext } from "solid-js";
import { Block } from "./entities";

const initialLayout: Block[] = [
   { type: 'text', value: 'Мы вынуждены отталкиваться от того, что выбранный нами инновационный путь однозначно определяет каждого участника как способного принимать собственные решения касаемо дальнейших направлений развития.' }
]

const initialState = [
   {
      isDragging: false as boolean,
      draggingItem: null as Block | null,
      isPlacementCorrect: true as boolean,
      projection: new Set<number>() as Set<number>,
      projectionSlotId: '' as string,
      layout: initialLayout,
      updater: true as boolean,
   },
   {
      onDragStart(block: Block, slotId: string, absX: number, absY: number) { },
      onDrag(block: Block, slotId: string, absX: number, absY: number) { },
      onDragEnd(block: Block, slotId: string, absX: number, absY: number) { },
      force() { },
   },
] as const;


const EditorStore = createContext(initialState);

export function EditorStoreProvider(props: PropsWithChildren<{}>) {


   return <EditorStore.Provider value={initialState}>{props.children}</EditorStore.Provider>
}
export const useEditorStore = () => useContext(EditorStore)
