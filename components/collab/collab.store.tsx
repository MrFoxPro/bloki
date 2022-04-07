import throttle from "lodash.throttle";
import { createContext, createEffect, createEffect as createRenderEffect, on, onCleanup, PropsWithChildren, untrack, useContext } from "solid-js";
import { createStore, reconcile, SetStoreFunction, unwrap } from "solid-js/store";
import { CURSOR_UPDATE_RATE, Roommate, WSMsg, WSMsgType } from "@/lib/network.types";
import { useAppStore } from "@/lib/app.store";
import { useEditorStore } from "../bloki-editor/editor.store";
import { Point } from "../bloki-editor/types/blocks";

type CollabContextValues = {
   rommates: Roommate[];
   cursor: Point;
   connected: boolean;
};
type CollabContextHandlers = {
   setCollabStore: SetStoreFunction<CollabContextValues>;
};

const CollabContext = createContext<[CollabContextValues, CollabContextHandlers]>(
   [
      {
         rommates: [],
         cursor: { x: 0, y: 0 },
         connected: false,
      },
      {
         setCollabStore: () => void 0,
      }
   ]
);

type CollabStoreProviderProps = PropsWithChildren<{}>;
export function CollabStoreProvider(props: CollabStoreProviderProps) {
   const [collab, setCollabStore] = createStore(CollabContext.defaultValue[0]);

   const [editor] = useEditorStore();
   const [app] = useAppStore();

   const wsHost = import.meta.env.DEV ? 'ws://localhost:3005/ws' : 'wss://bloki.app/ws';

   let ws: WebSocket;

   function send(type: WSMsgType, data: object = {}) {
      if (!ws) return;
      if (ws.readyState === ws.CONNECTING) {
         return setTimeout(() => send(type, data), 400);
      }
      const serialized = JSON.stringify({ name: app.name, type, data } as WSMsg);
      ws.send(serialized);
   }

   function onMessage(ev: MessageEvent) {
      if (!ev.data) return;
      const msg = JSON.parse(ev.data) as WSMsg;
      if (!msg) return;

      const { type, data } = msg;
      if (type == null) return;

      switch (msg.type) {
         case WSMsgType.Roommates: {
            setCollabStore('rommates', reconcile(data));
            break;
         }
         case WSMsgType.CursorUpdate: {
            setCollabStore('rommates', rm => rm.name === data.name, {
               cursor: data.cursor,
               color: data.color
            });
            console.log(unwrap(collab.rommates));
            break;
         }
         case WSMsgType.Blob: {
            break;
         }
         default:
            console.warn('Unknown message type');
            break;
      }
   }

   const sendMouse = throttle((e: MouseEvent) =>
      setCollabStore({ cursor: { x: e.pageX, y: e.pageY } }), CURSOR_UPDATE_RATE, { leading: true, trailing: true });

   function disconnect() {
      document.removeEventListener('mousemove', sendMouse);
      if (ws) {
         ws?.close();
         ws = null;
         console.log('Disconnected!');
      }
      setCollabStore({ connected: false });
   }

   createEffect(() => {
      if (editor.document.id && app.name) {
         if (editor.document.shared) {
            if (untrack(() => collab.connected)) disconnect();

            ws = new WebSocket(wsHost + '/' + editor.document.id);
            ws.onopen = function () {
               setCollabStore({
                  connected: true
               });
               console.log('Connected to document server', untrack(() => editor.document.title));
            };

            ws.onmessage = onMessage;
            ws.onerror = () => setCollabStore({ connected: false });
            ws.onclose = () => setCollabStore({ connected: false });
            document.addEventListener('mousemove', sendMouse);

            send(WSMsgType.Join, {
               name: app.name,
               cursor: untrack(() => collab.cursor),
               workingBlockId: untrack(() => editor.editingBlock?.id)
            });
         }
         else {
            disconnect();
         }
      }
   });

   createRenderEffect(() => {
      if (!collab.connected) return;
      send(WSMsgType.CursorUpdate, { cursor: collab.cursor });
   });

   let statusInterval: number;
   onCleanup(() => {
      clearInterval(statusInterval);
      ws?.close();
      document.removeEventListener('mousemove', sendMouse);
   });

   return (
      <CollabContext.Provider value={[collab, { setCollabStore }]}>
         {props.children}
      </CollabContext.Provider>
   );
}

export const useCollabStore = () => useContext(CollabContext);