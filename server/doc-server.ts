import { BlokiDocument } from "../lib/entities";
import { getRandomColor, mapValuesArray } from "../lib/helpers";
import { Roommate, WSMsg, WSMsgType } from "../lib/network.types";
import { introDoc } from "../lib/test-data/hackaton-data";
import { WebSocketServer, WebSocket } from "ws";
import { blobStorage } from "./db";
import { tg } from "./tg-console";

function send(ws: WebSocket, type: WSMsgType, data: any) {
   const serialized = JSON.stringify({ type, data } as WSMsg);
   ws.send(serialized);
};
function logtg(...msg: string[]) {
   console.log(...msg);
   tg(...msg);
}
export class DocumentServer {
   wss: WebSocketServer;
   room: Map<WebSocket, Roommate>;
   blob: Buffer;
   willResetAt: number;
   doc: BlokiDocument;
   constructor(doc: BlokiDocument) {
      if (!doc.shared) throw new Error();
      this.doc = doc;

      this.blob = blobStorage.get(doc.id);
      this.room = new Map();
      this.willResetAt = Date.now() + 5 * 60 * 1000;

      this.wss = new WebSocketServer({ noServer: true });

      this.wss.on('connection', (ws, req) => {
         (ws as any).isAlive = true;

         ws.on('message', (buf) => {
            // CRDT? Yes I heard about this crypto currency :p
            const msg = JSON.parse(buf.toString()) as WSMsg;
            if (!msg) return;

            const { type, data } = msg;
            if (type == null) return;

            switch (msg.type) {
               case WSMsgType.Join: {
                  this.room.set(ws, {
                     name: data.name,
                     cursor: data.cursor,
                     color: getRandomColor(),
                     workingBlockId: data.workingBlockId
                  });
                  logtg('User %s joined document "%s"', data.name, this.doc.title);
                  this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
                  break;
               }
               case WSMsgType.CursorUpdate: {
                  const user = this.room.get(ws);
                  if (!user) return;
                  user.cursor = data.cursor;
                  this.room.forEach((rm, socket) => rm.name !== user.name && send(socket, WSMsgType.CursorUpdate, user));
                  break;
               }
               case WSMsgType.Roommates: {
                  this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
                  break;
               }
               default:
                  console.log('Unknown message', msg, req.socket.remoteAddress);
                  break;
            }
         });

         ws.on('close', () => {
            logtg('User %s left', this.room.get(ws)?.name);
            this.room.delete(ws);
            this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
         });

      });
   }
}