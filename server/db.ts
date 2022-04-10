import { AnyBlock } from '@/components/bloki-editor/types/blocks';
import crypto from 'crypto';
import fs from 'fs';
import path from 'node:path';
import { hackWorkspace, introDoc, emptyDoc, docWithSimpleLayout } from "../lib/test-data/hackaton-data";

const introImageBlob = fs.readFileSync(path.resolve(__dirname, '../lib/test-data/assets/intro.png'));
const emptyImageBlob = fs.readFileSync(path.resolve(__dirname, '../lib/test-data/assets/empty.png'));

const db = {
   workspaces: [hackWorkspace],
   users: [
      {
         selectedWorkspaceId: hackWorkspace.id,
         selectedDocumentId: introDoc.id,
      }
   ],
   docs: [introDoc, docWithSimpleLayout, emptyDoc, emptyDoc].map(doc => structuredClone(doc)),
} as const;

const blobStorage = new Map<string, Buffer>();
const layoutStorage = new Map<string, AnyBlock[]>();
db.docs.forEach((doc, i) => {
   if (doc.shared) {
      doc.id = crypto.randomUUID();
      doc.title = `Shared doc ${i}`;
   }
   blobStorage.set(doc.id, doc.id === introDoc.id ? introImageBlob : emptyImageBlob);
   layoutStorage.set(doc.id, structuredClone(doc.blocks));
});

export { db, blobStorage, layoutStorage, emptyImageBlob, introDoc };