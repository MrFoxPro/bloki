import { Accessor, createContext, createEffect, createMemo, createResource, mergeProps, onCleanup, onMount, PropsWithChildren, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { IApiProvider } from "./api-providers/api-provider.interface";
import { TestLocalApiProvider } from "./api-providers/local-api-provider";
import { BlokiDocument, User, Workspace } from "./entities";
import Cookie from 'js-cookie';
import throttle from "lodash.throttle";
import { WSMessageType } from "./WebSocketMessages";
import { lerp } from "./helpers";

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

   teammates: any[];
   lastUpdateTime: number;
};
type AppStoreHandlers = {
   moveItem(): void;
   deleteItem(): void;

   setAppStore: SetStoreFunction<AppStoreValues>;

   selectedWorkspace: Accessor<Workspace>;
   selectedDocument: Accessor<BlokiDocument>;

   getWhiteBoardData(): Promise<Blob>;
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
         teammates: [],
         lastUpdateTime: 0,
      },
      {
         moveItem: () => void 0,
         deleteItem: () => void 0,
         selectedWorkspace: () => void 0,
         selectedDocument: () => void 0,
         setAppStore: () => void 0,
         getWhiteBoardData: () => void 0,
      }
   ]
);

type AppStoreProps = PropsWithChildren<{
   apiProvider?: IApiProvider;
}>;

export function AppStoreProvider(props: AppStoreProps) {

   const [store, setStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);

   props = mergeProps(props, { apiProvider: new TestLocalApiProvider() });

   const base = import.meta.env.DEV ? 'http://127.0.0.1:3005' : 'https://bloki.app/api';
   const apiHost = () => base + `/${store.shardId}`;

   async function getWhiteBoardData() {
      return await fetch(`${apiHost()}/${selectedDocument()?.id}/whiteboard`).then(r => r.blob());
   }

   const [workspaces] = createResource<Workspace[]>(() => fetch(apiHost() + '/workspaces').then(r => r.json()), { initialValue: [] });
   const [documents] = createResource<BlokiDocument[]>(() => fetch(apiHost() + '/docs').then(r => r.json()), { initialValue: [] });
   const [user] = createResource<User>(() => fetch(apiHost() + '/user').then(r => r.json()));


   createEffect(() => {
      if (!documents.loading) {
         setStore({ documents: documents() });
      }
   });

   createEffect(() => {
      if (!user.loading && !workspaces.loading) {
         const u = user();
         const w = workspaces();
         setStore({ user: u, workspaces: w, ...u });
      }
   });

   const selectedWorkspace = createMemo(() => store.workspaces?.find(x => x.id === store.selectedWorkspaceId));
   const selectedDocument = createMemo(() => store.documents?.find(x => x.id === store.selectedDocumentId));

   createEffect(() => {
      if (!store.name) return;
      Cookie.set('name', store.name, { sameSite: 'strict' });
   });

   const shard = 0;
   const wsHost = import.meta.env.DEV ? 'ws://localhost:8080' : 'ws://bloki.app/ws';
   const socket = new WebSocket(wsHost);

   socket.onopen = (ev) => {
      console.log('WebSocket Client Connected', ev);
   };

   socket.onmessage = onMessage;
   socket.onerror = () => alert('Socker error. Please, reload page');
   socket.onclose = () => alert('Socker closed. Please, reload page');

   function send(type: WSMessageType, data: any) {
      if (socket.readyState === socket.CONNECTING) setTimeout(() => send(type, data), 400);
      else socket.send(JSON.stringify({
         type,
         shard,
         name: store.name,
         ...data,
      }));
   }

   function onMessage(ev: MessageEvent) {
      const data = JSON.parse(ev.data);
      console.log(data);

      if (data.type === WSMessageType.Teammates) {
         setStore('teammates', data.teammates);
      }
      if (data.type === WSMessageType.CursorUpdate) {
         // console.log(store.teammates)
         const pos = data.pos;
         setStore('teammates', t => t.name === data.user, 'cursor', pos);
      }
   }

   createEffect(() => {
      if (store.name) {
         send(WSMessageType.Teammates, null);
         send(WSMessageType.Join, { name: store.name });
      }
   });

   onCleanup(() => socket.close());

   const sendMouse = throttle((e: MouseEvent) => {
      send(WSMessageType.CursorUpdate, {
         x: e.pageX,
         y: e.pageY
      });
      setStore({ lastUpdateTime: performance.now() });
   }, 400);

   createEffect(() => {
      if (selectedDocument()?.shared) {
         document.addEventListener('mousemove', sendMouse);
      }
      else document.removeEventListener('mousemove', sendMouse);

      onCleanup(() => document.removeEventListener('mousemove', sendMouse));
   });
   return (
      <AppStore.Provider value={[
         store as AppStoreValues,
         {
            setAppStore: setStore,
            selectedWorkspace,
            selectedDocument,
            getWhiteBoardData,
         }
      ]}>
         {props.children}
      </AppStore.Provider>
   );
}

export const useAppStore = () => useContext(AppStore);
