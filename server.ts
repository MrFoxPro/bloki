require('console-stamp')(console, {
   format: ':date(HH:MM:ss) :label'
});

import fs from 'fs';
import crypto from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import fastifyInit from 'fastify';
import { emptyDoc, introDoc, hackWorkspace } from './lib/test-data/hackaton-data';
import { Roommate, WSMsg, WSMsgType as WSMsgType } from './lib/network.types';
import { getRandomColor, mapValuesArray } from './lib/helpers';
import { BlokiDocument } from './lib/entities';

const fastify = fastifyInit({ logger: false, });

const db = {
   workspaces: [hackWorkspace],
   users: [
      {
         selectedWorkspaceId: hackWorkspace.id,
         selectedDocumentId: introDoc.id,
      }
   ],
   docs: [introDoc].concat(new Array(3).fill(emptyDoc).map(doc => structuredClone(doc))),
} as const;

db.docs
   .filter(x => x.shared)
   .forEach((doc, i) => {
      doc.id = crypto.randomUUID();
      doc.title = `Shared doc ${i}`;
   });

const introImageBlob = fs.readFileSync('./lib/test-data/assets/intro.png');
const emptyImageBlob = fs.readFileSync('./lib/test-data/assets/empty.png');

fastify.register((fastify, opt, done) => {
   fastify.get('/user', () => {
      return db.users[0] as any;
   });
   fastify.get('/workspaces', () => {
      return db.workspaces as any;
   });
   fastify.get('/docs', () => {
      return db.docs as any;
   });
   done();
}, { prefix: '/api' });

function send(ws: WebSocket, type: WSMsgType, data: any) {
   const serialized = JSON.stringify({ type, data } as WSMsg);
   ws.send(serialized);
};

class DocumentServer {
   wss: WebSocketServer;
   room: Map<WebSocket, Roommate>;
   blob: Buffer;
   willResetAt: number;
   doc: BlokiDocument;
   constructor(doc: BlokiDocument) {
      if (!doc.shared) throw new Error();
      this.doc = doc;

      if (doc.id === introDoc.id) this.blob = introImageBlob;
      else this.blob = emptyImageBlob;
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
                  console.log('User %s joined document "%s"', data.name, this.doc.title);
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
            console.log('User %s left', this.room.get(ws)?.name);
            this.room.delete(ws);
            this.room.forEach((_, socket) => send(socket, WSMsgType.Roommates, mapValuesArray(this.room)));
         });
      });
   }
}

const servers = db.docs.filter(doc => doc.shared).map(doc => new DocumentServer(doc));

fastify.server.on('upgrade', (request, socket, head) => {
   console.log(request.url);
   if (!request.url) return;
   const docId = request.url.slice(1);
   const docServer = servers.find(x => x.doc.id === docId);
   if (!docServer) return;
   docServer.wss.handleUpgrade(request, socket, head, (ws) => {
      docServer.wss.emit('connection', ws, request);
   });
});


process.on('uncaughtException', (e) => {
   console.log('Error!', e);
});
(async function () {
   await fastify.listen(3005);
})();
console.log('starting');

