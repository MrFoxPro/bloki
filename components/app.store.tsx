import { Accessor, createContext, createEffect, createMemo, createResource, mergeProps, onCleanup, onMount, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { IApiProvider } from "../lib/api-providers/api-provider.interface";
// import { TestLocalApiProvider } from "../lib/api-providers/local-api-provider";
import { BlokiDocument, User, Workspace } from "../lib/entities";
import Cookie from 'js-cookie';

export type AppStoreValues = {
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
         // api mocks
         user: {
            selectedDocumentId: 'd07cac49-f0ab-402e-989b-12789000ec2a',
            selectedWorkspaceId: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
         },
         workspaces: [
            {
               id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
               workspaceIcon: '../../assets/favicon-32x32.png',
               title: 'Bloki workspace',
            }
         ],
         selectedWorkspaceId: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
         documents: [],
         selectedDocumentId: null,

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

   // props = mergeProps(props, { apiProvider: new TestLocalApiProvider() });

   const [documents] = createResource<BlokiDocument[]>(() => fetch(baseApiUrl + '/docs').then(r => r.json()), { initialValue: [] });

   createEffect(() => {
      if (!documents.loading) {
         if (!documents().length) return;
         setAppStore({ documents: documents() });
         if (!state.selectedDocumentId || !state.documents.some(x => x.id === state.selectedDocumentId)) {
            setAppStore({ selectedDocumentId: state.documents[0].id });
         }
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
