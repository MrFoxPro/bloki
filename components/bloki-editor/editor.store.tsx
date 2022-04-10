import { Accessor, batch, createComputed, createContext, createEffect, createMemo, mergeProps, onCleanup, PropsWithChildren, untrack, useContext } from "solid-js";
import { createNanoEvents, Emitter } from 'nanoevents';
import { createStore, DeepReadonly, reconcile, SetStoreFunction } from "solid-js/store";
import {
   AnyBlock,
   BlockTransform,
   Dimension,
   PlacementStatus,
   Point
} from "./types/blocks";
import { BlokiDocument } from "@/lib/entities";
import { EditType, Instrument } from "./types/editor";
import { checkPlacement as checkPlacementHelper } from "./helpers";
import { ChangeEventInfo, CURSOR_UPDATE_RATE, Roommate, WSMsg, WSMsgType } from "@/lib/network.types";
import { useAppStore } from "@/lib/app.store";
import { useDrawerStore } from "./drawer.store";
import throttle from "lodash.throttle";

type EditorStoreValues = DeepReadonly<{
   editingBlock?: AnyBlock;
   editingType?: EditType;

   selectedBlocks: AnyBlock[];
   overflowedBlocks: AnyBlock[];
   isPlacementCorrect: boolean;
   document: BlokiDocument;
   layout: AnyBlock[];
   showContextMenu: boolean;

   rommates: Roommate[];
   cursor: Point;
   connected: boolean;

}>;

type CalculatedSize = {
   gap_px: string;
   size_px: string;
   sum_px: string;
   fGridWidth: number;
   fGridHeight: number;
   mGridWidth: number;
   mGridHeight: number;
   fGridWidth_px: string;
   fGridHeight_px: string;
   mGridWidth_px: string;
   mGridHeight_px: string;
};

interface EditorEvents {
   changestart(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   change(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   changeend(block: AnyBlock, changeInfo: ChangeEventInfo): void;
   containerrectchanged(rect: DOMRect): void;
   maingridcursormoved(block: BlockTransform, isOut: boolean): void;
}

class StaticEditorData {
   private emitter: Emitter<EditorEvents>;
   public containerRect: DOMRect;
   constructor() {
      this.emitter = createNanoEvents<EditorEvents>();
   }

   on<E extends keyof EditorEvents>(event: E, callback: EditorEvents[E]) {
      return this.emitter.on(event, callback);
   }

   emit<K extends keyof EditorEvents>(event: K, ...args: Parameters<EditorEvents[K]>) {
      return this.emitter.emit(event, ...args);
   }
}

type ChangeHandler = (block: AnyBlock, absTransform: BlockTransform, type: EditType) => void;

type EditorStoreHandles = {
   onChangeStart: ChangeHandler;
   onChange: ChangeHandler;
   onChangeEnd: ChangeHandler;
   gridSize(factor: number): number;
   gridBoxSize: Accessor<number>;
   realSize: Accessor<CalculatedSize>;
   getRelativePosition(absX: number, absY: number): Point;
   getAbsolutePosition(x: number, y: number): Point;
   getRelativeSize(width: any, height: any, roundFunc?: (x: number) => number): Dimension;
   getAbsoluteSize(width: number, height: number): Dimension;
   checkPlacement(block: BlockTransform, x?: number, y?: number, width?: number, height?: number): PlacementStatus;

   selectBlock(block: AnyBlock, type?: EditType): void;
   deleteBlock(block: AnyBlock): void;

   setEditorStore: SetStoreFunction<EditorStoreValues>;
   staticEditorData: StaticEditorData;
   send(type: WSMsgType, data?: object): void;
};

const EditorStore = createContext<[EditorStoreValues, EditorStoreHandles]>();

type EditorStoreProviderProps = PropsWithChildren<{
   document: BlokiDocument;
   instrument?: Instrument;
}>;

export function EditorStoreProvider(props: EditorStoreProviderProps) {
   props = mergeProps({
      instrument: Instrument.Cursor
   }, props);

   const [app] = useAppStore();
   const [drawer, { setDrawerStore }] = useDrawerStore();

   const staticEditorData = new StaticEditorData();

   const [editor, setEditorStore] = createStore<EditorStoreValues>(
      {
         editingBlock: null,
         editingType: null,
         selectedBlocks: [],
         showContextMenu: false,
         overflowedBlocks: [],
         isPlacementCorrect: false,
         document: null,
         layout: [],
         rommates: [],
         cursor: { x: 0, y: 0 },
         connected: false,
      }
   );

   const wsHost = import.meta.env.DEV ? 'ws://localhost:3005/ws' : 'wss://bloki.app/ws';

   createComputed(() => {
      setEditorStore({
         document: props.document
      });
   });

   const gridBoxSize = createMemo(() => editor.document.layoutOptions.gap + editor.document.layoutOptions.size);

   function gridSize(factor: number) {
      if (factor <= 0) return 0;
      return factor * (editor.document.layoutOptions.size + editor.document.layoutOptions.gap) - editor.document.layoutOptions.gap;
   }

   const realSize = createMemo(() => {
      const cellPx = {
         gap_px: editor.document.layoutOptions.gap + 'px',
         size_px: editor.document.layoutOptions.size + 'px',
         sum_px: (editor.document.layoutOptions.size + editor.document.layoutOptions.gap) + 'px'
      };
      const dimensionsKeys = ['fGridWidth', 'fGridHeight', 'mGridWidth', 'mGridHeight'];
      const grid = dimensionsKeys.reduce((prev, curr) => ({ ...prev, [curr]: gridSize(editor.document.layoutOptions[curr]) }), {});
      const gridPx = dimensionsKeys.reduce((prev, curr) => ({ ...prev, [curr + '_px']: (grid[curr] + 'px') }), {});
      return { ...cellPx, ...grid, ...gridPx } as CalculatedSize;
   });


   function getRelativePosition(absX: number, absY: number) {
      const x = Math.floor(absX / gridBoxSize());
      const y = Math.floor(absY / gridBoxSize());
      return { x, y };
   }

   function getAbsolutePosition(x: number, y: number) {
      return { x: x * gridBoxSize(), y: y * gridBoxSize() };
   }

   function getRelativeSize(width, height, roundFunc = Math.ceil) {
      return {
         width: roundFunc(width / gridBoxSize()),
         height: roundFunc(height / gridBoxSize())
      };
   }

   function getAbsoluteSize(width: number, height: number) {
      return { width: gridSize(width), height: gridSize(height) };
   }
   const checkPlacement = (block: BlockTransform, x = block.x, y = block.y, width = block.width, height = block.height) =>
      checkPlacementHelper(editor.layout, editor.document.layoutOptions, block, x, y, width, height);

   function onChangeStart(block: AnyBlock, abs: BlockTransform, type: EditType) {
      setEditorStore({ editingBlock: block, editingType: type });

      const relTransform = { height: block.height, width: block.width, x: block.x, y: block.y };
      staticEditorData.emit('changestart', block, {
         absTransform: abs,
         placement: { correct: true, intersections: [], outOfBorder: false, affected: [] },
         relTransform,
         type
      });
   }

   function onChange(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);

      const placement = checkPlacement(block, x, y, width, height);
      setEditorStore({ isPlacementCorrect: placement.correct, overflowedBlocks: placement.affected });
      staticEditorData.emit('change', block, {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function onChangeEnd(block: AnyBlock, absTransform: BlockTransform, type: EditType) {
      const { x, y } = getRelativePosition(absTransform.x, absTransform.y);
      const { width, height } = getRelativeSize(absTransform.width, absTransform.height);
      const placement = checkPlacement(block, x, y, width, height);
      const relTransofrm = { x, y, width, height };
      batch(() => {
         setEditorStore({
            editingBlock: null,
            editingType: 'select',
            isPlacementCorrect: true,
            overflowedBlocks: [],
         });

         if (placement.correct) {
            setEditorStore('layout', editor.layout.indexOf(block), { x, y, width, height });
            send(WSMsgType.ChangeEnd, { block, rel: relTransofrm, type });
            return;
         }
         setEditorStore('layout', editor.layout.indexOf(block), { x: block.x, y: block.y, width: block.width, height: block.height });
      });

      staticEditorData.emit('changeend', block, {
         absTransform,
         placement,
         relTransform: { x, y, width, height },
         type
      });
   }

   function selectBlock(selectedBlock: AnyBlock, type: EditType = 'select') {
      if (selectedBlock) {
         setEditorStore({
            editingBlock: selectedBlock,
            editingType: type,
         });
      }
      else {
         setEditorStore({
            editingBlock: null,
            editingType: null,
         });
      }
   }
   function deleteBlock(block: AnyBlock) {
      if (editor.editingBlock === block) {
         setEditorStore({
            editingBlock: null,
            editingType: null
         });
      }
      setEditorStore('layout', blocks => blocks.filter(b => b.id !== block.id));
      send(WSMsgType.DeleteBlock, block.id);
   }
   let ws: WebSocket;

   function send(type: WSMsgType, data: object = {}) {
      if (!ws) return;
      if (ws.readyState === ws.CONNECTING) {
         setTimeout(() => send(type, data), 400);
         return;
      }
      const serialized = JSON.stringify({ type, data } as WSMsg);
      ws.send(serialized);
   }

   let drawFromServer;
   function onMessage(ev: MessageEvent) {
      if (!ev.data) return;

      if (ev.data instanceof Blob) {
         console.log('got buffer', ev.data.type);
         drawFromServer = ev.data;
         setDrawerStore({ blob: ev.data });
         return;
      }
      const msg = JSON.parse(ev.data) as WSMsg;
      if (!msg) return;

      const { type, data } = msg;
      if (type == null) return;

      switch (msg.type) {
         case WSMsgType.Roommates: {
            console.log(data);
            setEditorStore('rommates', reconcile(data));
            break;
         }
         case WSMsgType.CursorUpdate: {
            setEditorStore('rommates', rm => rm.name === data.name, {
               cursor: data.cursor,
               color: data.color
            });
            break;
         }
         case WSMsgType.Layout: {
            console.log('resetting layout');
            setEditorStore('layout', reconcile(data));
            break;
         }
         case WSMsgType.ChangeEnd: {
            const block = data as AnyBlock;
            if (!block) return;
            console.log('changeEnd', block);
            setEditorStore('layout', b => b.id === block.id, block);
            break;
         }
         case WSMsgType.CreateBlock: {
            const block = data as AnyBlock;
            if (!block) return;
            console.log('creating block', block);
            setEditorStore('layout', l => l.concat(block));
            break;
         }
         case WSMsgType.DeleteBlock: {
            const blockId = data as string;
            if (!blockId) return;
            console.log('deleting block', blockId);
            setEditorStore('layout', l => l.filter(x => x.id !== blockId));
            break;
         }
         case WSMsgType.ChangeBlock: {
            const block = data as AnyBlock;
            if (!block) return;
            console.log('changing block', block);
            setEditorStore('layout', b => b.id === block.id, reconcile(block));
            break;
         }
         default:
            console.warn('Unknown message type');
            break;
      }
   }

   const sendMouse = throttle((e: MouseEvent) =>
      setEditorStore({ cursor: { x: e.pageX, y: e.pageY } }), CURSOR_UPDATE_RATE, { leading: false, trailing: true });

   function disconnect() {
      document.removeEventListener('mousemove', sendMouse);
      if (ws) {
         ws?.close();
         ws = null;
         console.log('Disconnected!');
      }
      setEditorStore({ connected: false });
   }

   createEffect(() => {
      if (editor.document.id && app.name) {
         if (editor.document.shared) {
            if (ws && ws.readyState !== ws.CLOSED) disconnect();

            ws = new WebSocket(wsHost + '/' + editor.document.id);
            ws.onopen = function () {
               setEditorStore({
                  connected: true
               });
               console.log('Connected to document server', untrack(() => editor.document.title));
            };

            ws.onmessage = onMessage;
            ws.onerror = () => setEditorStore({ connected: false });
            ws.onclose = () => setEditorStore({ connected: false });
            document.addEventListener('mousemove', sendMouse);

            send(WSMsgType.Join, {
               name: app.name,
               cursor: untrack(() => editor.cursor),
               workingBlockId: untrack(() => editor.editingBlock?.id)
            });
         }
         else {
            disconnect();
         }
      }
   });

   createEffect(() => {
      if (!editor.connected) return;
      send(WSMsgType.CursorUpdate, { cursor: editor.cursor });
   });
   function sendBlob(b: Blob) {
      if (ws.readyState === ws.CONNECTING) {
         setTimeout(() => sendBlob(b), 400);
         return;
      }
      ws.send(drawer.blob);
   }
   createEffect(() => {
      if (!drawer.blob || !ws) return;
      if (drawer.blob === drawFromServer) return;
      sendBlob(drawer.blob);
   });

   createEffect(() => {
      console.log('editing block changing btw');
      send(WSMsgType.SelectBlock, editor.editingBlock?.id);
   });

   let statusInterval: number;
   onCleanup(() => {
      clearInterval(statusInterval);
      ws?.close();
      document.removeEventListener('mousemove', sendMouse);
   });
   // let verticallySortedDocs: string[];
   // createEffect(() => {

   // })

   return (
      <EditorStore.Provider value={[
         editor,
         {
            onChangeStart,
            onChange,
            onChangeEnd,
            checkPlacement,
            gridSize,
            realSize,
            gridBoxSize,
            getRelativePosition,
            getAbsolutePosition,
            getAbsoluteSize,
            getRelativeSize,

            selectBlock,
            deleteBlock,

            send,

            setEditorStore: setEditorStore,
            staticEditorData
         }
      ]}>
         {props.children}
      </EditorStore.Provider>
   );
}

export const useEditorStore = () => useContext(EditorStore);
