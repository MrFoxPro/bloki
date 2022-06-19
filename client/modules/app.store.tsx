import { createContext, createEffect, createResource, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
// import { IApiProvider } from "../lib/api-providers/api-provider.interface";
// import Cookie from 'js-cookie';
import { gqlClient } from "@/lib/client";
import { GridRenderMethod, User } from "@/lib/schema.auto";

export type AppStoreValues = {

} & User;

type AppStoreHandlers = {
   setAppStore: SetStoreFunction<AppStoreValues>;
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>(
   [
      {
         locale: null,
         gridRenderMethod: GridRenderMethod.Canvas,
      },
      {
         setAppStore: () => void 0,
      }
   ]
);

type AppStoreProps = PropsWithChildren;

export function AppStoreProvider(props: AppStoreProps) {
   const [state, setAppStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   const [meResource] = createResource(() => gqlClient.me());

   return (
      <AppStore.Provider value={[state, { setAppStore, }]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
