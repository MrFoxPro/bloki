import { WebSocketServer } from 'ws';
import fastifyInit from 'fastify';
import fastifyCors from 'fastify-cors';
import { hackatonUser, emptyDoc, introDoc, hackWorkspace } from './lib/test-data/hackaton-data';
import fs from 'fs';
import { WSMessageType } from './lib/WebSocketMessages';

const introImageBlob = fs.readFileSync('./lib/test-data/assets/intro.png');
const emptyImageBlob = fs.readFileSync('./lib/test-data/assets/empty.png');

const fastify = fastifyInit({ logger: false, });
fastify.register(fastifyCors, {
   origin: "*"
});

const user = {
   selectedWorkspaceId: hackWorkspace.id,
   selectedDocumentId: introDoc.id,
};
const db = {
   teammates: new Map(),
   workspaces: [hackWorkspace],
   users: [hackatonUser],
   docs: [emptyDoc, introDoc]
} as const;

const shards = new Array<typeof db>(2).fill(null).map(() => structuredClone(db)) as (typeof db)[];
shards.forEach(shard => {
   shard.docs.forEach((doc, i) => {
      if (i === 0) doc.whiteboard.blob = emptyImageBlob.slice();
      else doc.whiteboard.blob = introImageBlob.slice();
   });
});

fastify.get('/:shardId/user', (req, rep) => {
   return user;
});
fastify.get('/:shardId/workspaces', (req, rep) => {
   const { shardId } = req.params;
   const wss = shards[shardId]?.workspaces;
   return wss;
});
fastify.get('/:shardId/docs', (req, rep) => {
   const { shardId } = req.params;
   const docs = shards[shardId]?.docs;
   return docs?.map(doc => ({ ...doc, whiteboard: { ...doc.whiteboard, blob: null } }));
});

fastify.get('/:shardId/:docId/whiteboard', (req, rep) => {
   const { shardId, docId } = req.params;
   const doc = shards[shardId]?.docs.find(x => x.id === docId);
   return doc?.whiteboard.blob;
});

const wss = new WebSocketServer({
   port: 8080,
});
const randomColor = () => Math.floor(Math.random() * 16777215).toString(16);
wss.on('connection', (ws, req) => {
   const send = (type: WSMessageType, data, w = ws) => {
      w.send(JSON.stringify({
         type,
         ...data
      }));
   };
   const broadcast = (type: WSMessageType, data) => {
      wss.clients.forEach(client => send(type, data, client));
   };
   const tt = (s: Map<string, any>) => Array.from(s.values());

   ws.on('message', (data) => {
      data = JSON.parse(data);
      const { type, shard } = data;
      if (type === WSMessageType.Join) {
         shards[shard].teammates.set(req.socket.remoteAddress, {
            name: data.name,
            action: {},
            cursor: { x: 0, y: 0 },
            color: randomColor()
         });
         const { teammates } = shards[shard];
         broadcast(WSMessageType.Teammates, { teammates: tt(teammates) });
      }
      else if (type === WSMessageType.Teammates) {
         const { teammates } = shards[shard];
         send(WSMessageType.Teammates, { teammates: tt(teammates) });
      }
      else if (type === 'update') {

      }
      else if (type === WSMessageType.CursorUpdate) {
         const whom = shards[shard].teammates.get(req.socket.remoteAddress);
         if (!whom) return;
         const pos = { x: data.x, y: data.y };
         whom.cursor = pos;
         broadcast(WSMessageType.CursorUpdate, {
            user: whom.name,
            pos
         });
      }

   });
   ws.on('close', () => {
      shards.forEach(shard => shard.teammates.delete(req.socket.localAddress));
   });
});

(async function () {
   await fastify.listen(3005);
})();


