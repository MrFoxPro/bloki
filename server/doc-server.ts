import { BlokiDocument } from "../lib/entities";
import { getRandomColor, mapValuesArray } from "../lib/helpers";
import { Roommate, WSMsg, WSMsgType } from "../lib/network.types";
import { WebSocketServer, WebSocket } from "ws";
import { blobStorage } from "./db";
import { tg } from "./tg-console";
import { request } from 'node:http';

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

         ws.on('message', async (buf) => {
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

         ws.on('close', (code, reason) => {
            logtg('User %s left. Code: %s. Reason: %s', this.room.get(ws)?.name, code.toString(), reason.toString());
            this.room.delete(ws);
            this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
         });

      });
   }
}