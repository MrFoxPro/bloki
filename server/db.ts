import crypto from 'crypto';
import fs from 'fs';
import { hackWorkspace, introDoc, emptyDoc, docWithSimpleLayout } from "../lib/test-data/hackaton-data";

const introImageBlob = fs.readFileSync('../lib/test-data/assets/intro.png');
const emptyImageBlob = fs.readFileSync('../lib/test-data/assets/empty.png');

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
db.docs.forEach((doc, i) => {
   doc.id = crypto.randomUUID();
   blobStorage.set(doc.id, doc.id === introDoc.id ? introImageBlob : emptyImageBlob);
   if (doc.shared) {
      doc.title = `Shared doc ${i}`;
   }
});

export { db, blobStorage };