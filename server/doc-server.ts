// This is not intended to production
import { BlokiDocument } from "../lib/entities";
import { getRandomColor, mapValuesArray } from "../lib/helpers";
import { Roommate, WSMsg, WSMsgType } from "../lib/network.types";
import { WebSocketServer, WebSocket } from "ws";
import { tg } from "./tg-console";
import { request, IncomingMessage } from 'node:http';
import fileType from 'file-type';
import { AnyBlock, BlockTransform, isImageBlock } from "../components/bloki-editor/types/blocks";
import { checkPlacement } from "../components/bloki-editor/helpers";
import { EditType } from "../components/bloki-editor/types/editor";
import { deleteImage, getImgPath, paintings, saveImage } from "./db";
import fs from 'fs';
import path from 'path';

function send(ws: WebSocket, type: WSMsgType, data: any) {
   const serialized = JSON.stringify({ type, data } as WSMsg);
   ws.send(serialized);
};
function logtg(...msg: string[]) {
   console.log(...msg);
   tg(...msg);
}
function getCountry(addr: string): Promise<{ country: string, city: string; }> {
   return new Promise((res, rej) => {
      const req = request(`http://ip-api.com/json/${addr}?fields=country,city`, (r) => {
         r.on('data', d => res(JSON.parse(d.toString())));
      });
      req.on('error', (e) => rej(e));
      req.end();
   });
}

function decodeBase64Image(dataString) {
   const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

   if (matches.length !== 3) {
      return [null, null];
   }

   return [matches[1], Buffer.from(matches[2], 'base64')] as const;
}
export class DocumentServer {
   wss: WebSocketServer;
   room = new Map<WebSocket, Roommate>();
   doc: BlokiDocument;
   constructor(doc: BlokiDocument) {
      if (!doc.shared) throw new Error();
      this.doc = doc;
      this.wss = new WebSocketServer({ noServer: true });
      this.wss.on('connection', this.connection);
   }
   connection = (ws: WebSocket, req: IncomingMessage) => {
      ws.on('message', async (buf, isBinary) => {
         if (isBinary && buf instanceof Buffer) {
            const type = await fileType.fromBuffer(buf);
            if (type.ext === 'png') {
               paintings.set(this.doc.id, buf);
               this.room.forEach((_, socket) => socket != ws && socket.send(buf));
            }
            return;
         }

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
               let loc: { country: string, city: string; };
               if (process.env.MODE === 'prod') {
                  loc = await getCountry(req.headers['x-real-ip'] as string);
               }
               logtg('User %s joined document "%s"', data.name, this.doc.title, `\n Location: ${loc?.country}, ${loc?.city}`);
               send(ws, WSMsgType.Layout, this.doc.layout);
               ws.send(paintings.get(this.doc.id));
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
               const type = data.type as EditType;
               const rel = data.rel as BlockTransform;
               const block = data.block as AnyBlock;
               if (!rel || !block) return;

               const { correct } = checkPlacement(this.doc.layout, this.doc.layoutOptions, block, rel.x, rel.y, rel.width, rel.height);
               if (!correct) {
                  send(ws, WSMsgType.Layout, this.doc.layout);
                  return;
               }
               const myBlock = this.doc.layout.find(b => b.id === block.id);
               if (type === EditType.Drag) {
                  myBlock.x = rel.x;
                  myBlock.y = rel.y;
               }
               else if (type === EditType.Resize) {
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
               const { correct } = checkPlacement(this.doc.layout.concat(block), this.doc.layoutOptions, block);
               if (correct) {
                  this.doc.layout.push(block);
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.CreateBlock, block));
               }
               else {
                  send(ws, WSMsgType.Layout, this.doc.layout);
               }
               break;
            }
            case WSMsgType.DeleteBlock: {
               const blockId = data as string;
               const index = this.doc.layout.findIndex(x => x.id === blockId);
               if (index > -1) {
                  const block = this.doc.layout[index];
                  if (isImageBlock(block)) {

                     const possiblePath = path.join(process.cwd(), block.value);
                     console.log('deleting image block', possiblePath);
                     if (fs.existsSync(possiblePath)) {
                        fs.rmSync(possiblePath);
                        console.log('removed image');
                     }
                  }
                  this.doc.layout.splice(index, 1);
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.DeleteBlock, blockId));
               }
               else {
                  send(ws, WSMsgType.Layout, this.doc.layout);
               }
               break;
            }
            case WSMsgType.ChangeBlock: {
               const block = data as AnyBlock;
               const index = this.doc.layout.findIndex(x => x.id === block.id);
               if (index > -1) {
                  if (isImageBlock(block) && block.value && block.value !== this.doc.layout[index].value) {
                     const [type, buf] = decodeBase64Image(block.value);
                     if (type && buf) {
                        let ext = type.split('/')[1];
                        if (ext === 'svg+xml') ext = 'svg';
                        fs.writeFileSync(getImgPath("images", block.id, ext), buf);
                        block.value = `/static/images/${block.id}.${ext}`;
                     }
                     else if (block.value.length > 100) {
                        block.value = null;
                     }
                  }

                  this.doc.layout[index] = block;
                  this.room.forEach((_, socket) => socket != ws && send(socket, WSMsgType.ChangeBlock, block));
               }
               else {
                  send(ws, WSMsgType.Layout, this.doc.layout);
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
         this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
      });
   };
}