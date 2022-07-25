import { createContext, ParentProps, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
// import { IApiProvider } from "../lib/api-providers/api-provider.interface";
// import Cookie from 'js-cookie';
// import { gqlClient } from '@/lib/client';
// import { BlokiDocument, GridRenderMethod } from '@/lib/schema.auto';
import { Theme } from './theme.store';
import { Lang } from './i18n/i18n.module';
import { BlokiNetworkDocument } from '@/lib/network.types';
import { sampleDoc } from '@/lib/samples';

export type AppStoreValues = {
   settings: {
      locale: Lang;
      theme: string;
   };
   selectedDocument: BlokiNetworkDocument;
};

type AppStoreHandlers = {
   setAppStore: SetStoreFunction<AppStoreValues>;
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>([
   {
      settings: {
         locale: 'en',
         theme: Theme.Light
      },
      selectedDocument: sampleDoc
   },
   {
      setAppStore: () => void 0
   }
]);

type AppStoreProps = ParentProps;

export function AppStoreProvider(props: AppStoreProps) {
   const [state, setAppStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);
   return <AppStore.Provider value={[state, { setAppStore }]}>{props.children}</AppStore.Provider>;
}

export const useAppStore = () => useContext(AppStore);
