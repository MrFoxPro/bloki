import { createComputed, createContext, createMemo, createRenderEffect, createSignal, mergeProps, onMount, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction, unwrap } from "solid-js/store";
import { IApiProvider } from "./api-providers/api-provider.interface";
import { TestLocalApiProvider } from "./api-providers/local-api-provider";
import { BlokiDocument, User, Workspace } from "./entities";

export type AppStoreValues = {
   user: User;

   workspaces: Workspace[];
   isLoading: boolean;

   selectedWorkspace: Workspace;
   selectedDocument: BlokiDocument;

   apiProvider: IApiProvider;

   locale: 'en' | 'ru' | 'de';
   gridRenderMethod: 'canvas' | 'dom';
};
type AppStoreHandlers = {
   moveItem(): void;
   deleteItem(): void;

   selectWorkspace(workspace: Workspace): void;
   selectDocument(document: BlokiDocument): void;

   setStore: SetStoreFunction<AppStoreValues>;

   apiProvider: IApiProvider;
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>(
   [
      {
         user: null,
         workspaces: [],
         isLoading: true,

         selectedDocument: null,
         selectedWorkspace: null,

         apiProvider: null,

         locale: null,
         gridRenderMethod: 'canvas',
      },
      {
         moveItem: () => void 0,
         deleteItem: () => void 0,
         selectWorkspace: () => void 0,
         selectDocument: () => void 0,
         setStore: () => void 0,
         apiProvider: null,
      }
   ]
);

type AppStoreProps = PropsWithChildren<{
   apiProvider?: IApiProvider;
}>;

export function AppStoreProvider(props: AppStoreProps) {

   const [store, setStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   props = mergeProps(props, { apiProvider: new TestLocalApiProvider() });
   const apiProvider = createMemo(() => props.apiProvider);
   createComputed(async () => {
      await props.apiProvider.init();
      const me = await props.apiProvider.getMe();
      const workspaces = await props.apiProvider.getMyWorkspaces();
      setStore({
         user: me,
         workspaces,
         selectedWorkspace: me.selectedWorkspace ?? workspaces[0],
         selectedDocument: me.selectedDocument ?? workspaces[0].documents[0],
         apiProvider: props.apiProvider,
         isLoading: false,
      });
      console.log('data loaded', unwrap(store));
   });

   function moveItem() {

   }
   function deleteItem() {

   }

   function selectWorkspace(workspace: Workspace) {
      setStore({
         selectedWorkspace: workspace
      });
   }

   function selectDocument(document: BlokiDocument) {
      setStore({
         selectedDocument: document
      });
   }

   return (
      <AppStore.Provider value={[
         store as AppStoreValues,
         {
            moveItem,
            deleteItem,
            setStore,
            selectWorkspace,
            selectDocument,
            apiProvider: apiProvider(),
         }
      ]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
