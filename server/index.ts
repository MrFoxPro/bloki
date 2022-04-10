require('console-stamp')(console, {
   format: ':date(HH:MM:ss) :label'
});
import fastifyInit from 'fastify';
import { blobStorage, db, emptyImageBlob } from './db';
import { DocumentServer } from './doc-server';
import { tg } from './tg-console';

const servers = db.docs.filter(doc => doc.shared).map(doc => new DocumentServer(doc));

const fastify = fastifyInit({ logger: false, });

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
   fastify.get('/:docId/blob', (req, res) => {
      return blobStorage.get(req.params.docId) ?? emptyImageBlob;
   });
   done();
}, { prefix: '/api' });

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
fastify.server.on('upgrade', (request, socket, head) => {
   if (!request.url) return;
   const docId = request.url.match(uuidRegex)[0];
   if (!docId) return;
   const docServer = servers.find(x => x.doc.id === docId);
   if (!docServer) return;
   docServer.wss.handleUpgrade(request, socket, head, (ws) => {
      docServer.wss.emit('connection', ws, request);
   });
});

process.on('uncaughtException', (e) => {
   console.log('Error!', e);
   tg('Error happened %s %s', e.name.toString(), e.message.toString(), e.stack);
});
(async function () {
   await fastify.listen(3005, '0.0.0.0');
})();
console.log('starting');

