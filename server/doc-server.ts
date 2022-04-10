import { BlokiDocument } from "../lib/entities";
import { getRandomColor, mapValuesArray } from "../lib/helpers";
import { Roommate, WSMsg, WSMsgType } from "../lib/network.types";
import { WebSocketServer, WebSocket } from "ws";
import { blobStorage, layoutStorage } from "./db";
import { tg } from "./tg-console";
import { request, IncomingMessage } from 'node:http';
import fileType from 'file-type';
import { AnyBlock, BlockTransform, isTextBlock } from "../components/bloki-editor/types/blocks";
import { checkPlacement } from "../components/bloki-editor/helpers";
import { EditType } from "../components/bloki-editor/types/editor";

function send(ws: WebSocket, type: WSMsgType, data: any) {
   const serialized = JSON.stringify({ type, data } as WSMsg);
   ws.send(serialized);
};
function logtg(...msg: string[]) {
   console.log(...msg);
   tg(...msg);
}
function getCountry(addr: string) {
   return new Promise((res, rej) => {
      const req = request(`http://ip-api.com/json/${addr}?fields=country,city`, (r) => {
         r.on('data', d => res(JSON.parse(d.toString())));
      });
      req.on('error', (e) => rej(e));
      req.end();
   });
}

export class DocumentServer {
   wss: WebSocketServer;
   room = new Map<WebSocket, Roommate>();
   whiteboard: Buffer;
   willResetAt: number;
   doc: BlokiDocument;
   socketActivity = new Map<WebSocket, number>();
   constructor(doc: BlokiDocument) {
      if (!doc.shared) throw new Error();
      this.doc = doc;

      this.whiteboard = blobStorage.get(doc.id);
      this.willResetAt = Date.now() + 5 * 60 * 1000;
      this.wss = new WebSocketServer({ noServer: true });
      this.wss.on('connection', this.connection);
      setInterval(this.health, 60 * 1000);
   }

   connection = (ws: WebSocket, req: IncomingMessage) => {
      this.socketActivity.set(ws, Date.now());

      ws.on('message', async (buf, isBinary) => {
         if (isBinary) {
            const type = await fileType.fromBuffer(buf as Buffer);
            if (type.ext === 'png') {
               this.socketActivity.set(ws, Date.now());
               this.whiteboard = buf as Buffer;
               blobStorage.set(this.doc.id, this.whiteboard);
               this.room.forEach((_, socket) => socket != ws && socket.send(this.whiteboard));
            }
            return;
         }

         // CRDT? Yes I heard about this crypto currency :p
         const msg = JSON.parse(buf.toString()) as WSMsg;
         if (!msg) return;

         const { type, data } = msg;
         if (type == null) return;

         this.socketActivity.set(ws, Date.now());

         switch (msg.type) {
            case WSMsgType.Join: {
               this.room.set(ws, {
                  name: data.name,
                  cursor: data.cursor,
                  color: getRandomColor(),
                  workingBlockId: data.workingBlockId
               });
               let loc = {};
               if (process.env.MODE === 'prod') {
                  loc = await getCountry(req.headers['x-real-ip'] as string);
               }
               logtg('User %s joined document "%s"', data.name, this.doc.title, `\n Location: ${loc?.country}, ${loc?.city}`);
               this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
               break;
            }
            case WSMsgType.CursorUpdate: {
               const user = this.room.get(ws);
               if (!user) return;
               user.cursor = data.cursor;
               this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.CursorUpdate, user));
               break;
            }
            case WSMsgType.Roommates: {
               this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
               break;
            }
            case WSMsgType.ChangeEnd: {
               const myLayout = layoutStorage.get(this.doc.id);
               const type = data.type as EditType;
               const rel = data.rel as BlockTransform;
               const block = data.block as AnyBlock;
               if (!rel || !block) return;

               const { correct } = checkPlacement(myLayout, this.doc.layoutOptions, block, rel.x, rel.y, rel.width, rel.height);
               if (!correct) {
                  send(ws, WSMsgType.Layout, myLayout);
                  return;
               }
               const myBlock = myLayout.find(b => b.id === block.id);
               if (type === 'drag') {
                  myBlock.x = rel.x;
                  myBlock.y = rel.y;
               }
               else if (type === 'resize') {
                  myBlock.width = rel.width;
                  myBlock.height = rel.height;
               }
               this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.ChangeEnd, myBlock));
               break;
            }
            case WSMsgType.SelectBlock: {
               const blockId = data as string;
               const user = this.room.get(ws);
               user.workingBlockId = blockId;
               this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
               break;
            }
            case WSMsgType.CreateBlock: {
               const block = data as AnyBlock;
               const myLayout = layoutStorage.get(this.doc.id);
               const { correct } = checkPlacement(myLayout.concat(block), this.doc.layoutOptions, block);
               if (correct) {
                  myLayout.push(block);
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.CreateBlock, block));
               }
               else {
                  send(ws, WSMsgType.Layout, myLayout);
               }
               break;
            }
            case WSMsgType.DeleteBlock: {
               const blockId = data as string;
               const myLayout = layoutStorage.get(this.doc.id);
               const index = myLayout.findIndex(x => x.id === blockId);
               if (index > -1) {
                  myLayout.splice(index, 1);
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.DeleteBlock, blockId));
               }
               else {
                  send(ws, WSMsgType.Layout, myLayout);
               }
               break;
            }
            case WSMsgType.ChangeBlock: {
               const block = data as AnyBlock;
               const myLayout = layoutStorage.get(this.doc.id);
               const index = myLayout.findIndex(x => x.id === block.id);
               if (index > -1) {
                  myLayout[index] = block;
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.ChangeBlock, block));
               }
               else {
                  send(ws, WSMsgType.Layout, myLayout);
               }
               break;
            }
            default:
               console.log('Unknown message', msg, req.socket.remoteAddress);
               break;
         }
      });
      ws.on('close', (code) => {
         logtg('User %s left. Code: %s', this.room.get(ws)?.name, code.toString());
         this.room.delete(ws);
         this.socketActivity.delete(ws);
         this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
      });
   };
   health = () => {
      this.socketActivity.forEach((act, ws) => {
         if (Date.now() - act > 2 * 60 * 1000) {
            this.room.delete(ws);
            ws.close();
            this.socketActivity.delete(ws);
         }
      });
   };
   // poll = () => {
   // };
}