import { createContext, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { DrawingColor, Instrument } from "./types";

type DrawerContextValues = {
   readonly instrument: Instrument;
   readonly drawingColor: DrawingColor;
   readonly strokeWidth: number;
};
type DrawerContextHandlers = {
   setStore: SetStoreFunction<DrawerContextValues>;
};

const DrawerContext = createContext<[DrawerContextValues, DrawerContextHandlers]>([
   {
      instrument: Instrument.Cursor,
      drawingColor: DrawingColor.Blue,
      strokeWidth: 5,
   },
   {
      setStore: () => void 0,
   }
]);


type DrawerStoreProviderProps = PropsWithChildren<{

}>;
export function DrawerStoreProvider(props: DrawerStoreProviderProps) {
   const [store, setStore] = createStore(DrawerContext.defaultValue[0]);
   return <DrawerContext.Provider value={[store, { setStore }]}>{props.children}</DrawerContext.Provider>;
}

export const useDrawerStore = () => useContext(DrawerContext);