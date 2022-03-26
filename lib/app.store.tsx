import { createComputed, createContext, createEffect, createMemo, mergeProps, on, PropsWithChildren, useContext } from "solid-js";
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
};
type AppStoreHandlers = {
   moveItem(): void;
   deleteItem(): void;

   selectWorkspace(workspace: Workspace): void;
   selectDocument(document: BlokiDocument): void;

   setStore: SetStoreFunction<AppStoreValues>;
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>(
   [
      {
         user: null,
         workspaces: [],
         isLoading: true,

         selectedDocument: null,
         selectedWorkspace: null,
      },
      {
         moveItem: () => void 0,
         deleteItem: () => void 0,
         selectWorkspace: () => void 0,
         selectDocument: () => void 0,
         setStore: () => void 0,
      }
   ]
);

type AppStoreProps = PropsWithChildren<{
   apiProvider?: IApiProvider;
}>;

export function AppStoreProvider(props: AppStoreProps) {
   props = mergeProps(props, {
      apiProvider: new TestLocalApiProvider()
   });

   const [store, setStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   createComputed(async () => {
      const me = await props.apiProvider.getMe();
      const workspaces = await props.apiProvider.getMyWorkspaces();
      setStore({
         user: me,
         workspaces,
         isLoading: false,
      });
      console.log('data loaded', unwrap(store));
   });

   createComputed(() => {
      if (store.workspaces?.length) {
         setStore({
            selectedWorkspace: store.workspaces.find(x => x.id === store.user.selectedWorkspaceId)
         });
      }
   });

   createComputed(() => {
      if (store.selectedWorkspace) {
         setStore({
            selectedDocument: store.selectedWorkspace.documents.find(x => x.id === store.user.selectedDocumentId)
         });
      }
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
         }
      ]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
