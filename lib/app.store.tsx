import { batch, createComputed, createContext, mergeProps, PropsWithChildren, useContext } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { IApiProvider } from "./api-providers/api-provider.interface";
import { LocalApiProvider } from "./api-providers/local-api-provider";
import { BlokiDocument, LayoutOptions, User, Workspace } from "./entities";

export type AppStoreValues = {
   user: User;
   isLoading: boolean;

   selectedWorkspace: Workspace;
   selectedDocument: BlokiDocument;
};
type AppStoreHandlers = {
   moveItem(): void;
   deleteItem(): void;

   selectWorkspace(workspace: Workspace): void;
   selectDocument(document: BlokiDocument): void;

   changeLayoutOptions(workspaceId: string, documentId: string, options: LayoutOptions): void;

};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>(
   [
      {
         user: null,

         isLoading: true,

         selectedDocument: null,
         selectedWorkspace: null,
      },
      {
         moveItem: () => void 0,
         deleteItem: () => void 0,
         selectWorkspace: () => void 0,
         selectDocument: () => void 0,
         changeLayoutOptions: () => void 0,
      }
   ]
);

type AppStoreProps = PropsWithChildren<{
   apiProvider?: IApiProvider;
}>;

export function AppStoreProvider(props: AppStoreProps) {
   props = mergeProps(props, {
      apiProvider: new LocalApiProvider()
   });

   const [store, setStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   createComputed(async () => {
      const me = await props.apiProvider.getMe();
      const defaultWorkspace = me.workspaces[0];
      const defaultDocument = defaultWorkspace.documents[0];
      batch(() => {
         setStore('user', me);
         setStore('selectedWorkspace', defaultWorkspace);
         setStore('selectedDocument', defaultDocument);
      });
      console.log('data loaded', unwrap(store));
   });

   function moveItem() {

   }
   function deleteItem() {

   }

   function selectWorkspace(workspace: Workspace) {
      setStore('selectedWorkspace', workspace);
   }

   function selectDocument(document: BlokiDocument) {
      setStore('selectedDocument', document);
   }

   function changeLayoutOptions(workspaceId: string, documentId: string, options: LayoutOptions) {
      setStore('user', 'workspaces', ws => ws.id === workspaceId, 'documents', doc => doc.id === documentId, 'layoutOptions', options);
   }
   return (
      <AppStore.Provider value={[
         store as AppStoreValues,
         {
            moveItem,
            deleteItem,
            changeLayoutOptions,
            selectWorkspace,
            selectDocument
         }
      ]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
