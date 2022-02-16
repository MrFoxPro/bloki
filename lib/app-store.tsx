import { createContext, PropsWithChildren, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const AppStore = createContext([
   {
      workspaces: [

      ],
      documents: [],
      user: null as any,
   },
   {

   }
] as const);

export function AppStoreProvider(props: PropsWithChildren<{}>) {
   const [store, setStore] = createStore(AppStore.defaultValue[0]);
   const context = [
      store,
      {

      }
   ] as const;
   return <AppStore.Provider value={context}>{props.children}</AppStore.Provider>;
}

export const useAppStore = () => useContext(AppStore);
