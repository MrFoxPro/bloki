import { createContext, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { DrawingColor } from "./types/drawings";
import { Instrument } from "./types/editor";

type DrawerContextValues = {
   blob?: Blob;
   readonly instrument: Instrument;
   readonly drawingColor: DrawingColor;
   readonly strokeWidth: number;
};
type DrawerContextHandlers = {
   setDrawerStore: SetStoreFunction<DrawerContextValues>;
};

const DrawerContext = createContext<[DrawerContextValues, DrawerContextHandlers]>([
   {
      instrument: Instrument.Cursor,
      drawingColor: DrawingColor.Blue,
      strokeWidth: 5,
   },
   {
      setDrawerStore: () => void 0,
   }
]);


type DrawerStoreProviderProps = PropsWithChildren<{

}>;
export function DrawerStoreProvider(props: DrawerStoreProviderProps) {
   const [store, setDrawerStore] = createStore(DrawerContext.defaultValue[0]);
   return <DrawerContext.Provider value={[store, { setDrawerStore }]}>{props.children}</DrawerContext.Provider>;
}

export const useDrawerStore = () => useContext(DrawerContext);