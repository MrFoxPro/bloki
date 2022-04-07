import { Accessor, createContext, createEffect, createMemo, createResource, mergeProps, onCleanup, onMount, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { IApiProvider } from "./api-providers/api-provider.interface";
import { TestLocalApiProvider } from "./api-providers/local-api-provider";
import { BlokiDocument, User, Workspace } from "./entities";
import Cookie from 'js-cookie';
import { useNavigate } from "solid-app-router";

export type AppStoreValues = {
   shardId: number;
   user: User;

   workspaces: Workspace[];
   documents: BlokiDocument[];

   selectedWorkspaceId: string;
   selectedDocumentId: string;

   locale: 'en' | 'ru' | 'de';

   gridRenderMethod: 'canvas' | 'dom';

   name?: string;
};
type AppStoreHandlers = {
   setAppStore: SetStoreFunction<AppStoreValues>;

   selectedWorkspace: Accessor<Workspace>;
   selectedDocument: Accessor<BlokiDocument>;
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>(
   [
      {
         shardId: 0,
         user: null,
         workspaces: [],
         documents: [],
         selectedDocumentId: null,
         selectedWorkspaceId: null,

         locale: null,
         gridRenderMethod: 'canvas',

         name: Cookie.get('name'),
      },
      {
         selectedWorkspace: () => void 0,
         selectedDocument: () => void 0,
         setAppStore: () => void 0,
      }
   ]
);

type AppStoreProps = PropsWithChildren<{
   apiProvider?: IApiProvider;
}>;

export const baseApiUrl = '/api';

export function AppStoreProvider(props: AppStoreProps) {

   const [state, setAppStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   props = mergeProps(props, { apiProvider: new TestLocalApiProvider() });

   const [workspaces] = createResource<Workspace[]>(() => fetch(baseApiUrl + '/workspaces').then(r => r.json()), { initialValue: [] });
   const [documents] = createResource<BlokiDocument[]>(() => fetch(baseApiUrl + '/docs').then(r => r.json()), { initialValue: [] });
   const [user] = createResource<User>(() => fetch(baseApiUrl + '/user').then(r => r.json()));

   createEffect(() => {
      if (!documents.loading) {
         if (!documents().length) return;
         setAppStore({ documents: documents() });
         if (!state.selectedDocumentId || !state.documents.some(x => x.id === state.selectedDocumentId)) {
            setAppStore({ selectedDocumentId: state.documents[0].id });
         }
      }
   });

   createEffect(() => {
      if (!user.loading && !workspaces.loading) {
         const u = user();
         const w = workspaces();
         setAppStore({ user: u, workspaces: w, selectedWorkspaceId: w[0].id });
      }
   });

   const selectedWorkspace = createMemo(() => state.workspaces?.find(x => x.id === state.selectedWorkspaceId));
   const selectedDocument = createMemo(() => state.documents?.find(x => x.id === state.selectedDocumentId));

   createEffect(() => {
      if (!state.name) return;
      Cookie.set('name', state.name, { sameSite: 'strict' });
   });

   return (
      <AppStore.Provider value={[
         state as AppStoreValues,
         {
            setAppStore,
            selectedWorkspace,
            selectedDocument,
         }
      ]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
