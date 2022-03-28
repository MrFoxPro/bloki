// import { IndexeddbPersistence } from "y-indexeddb";
import { IApiProvider } from "./api-provider.interface";
import { BlokiDocument, User } from "../entities";
// import DOMPurify from 'dompurify';

const LS_KEY = 'bloki_data';

function clone<T>(obj: T) {
   if ((window as any).structuredClone) {
      return (window as any).structuredClone(obj) as T;
   }
   else return JSON.parse(JSON.stringify(obj)) as T;
}

type LocalDB = {
   _version: string;
   user: User;
};
export class TestLocalApiProvider implements IApiProvider {
   // provider: IndexeddbPersistence;

   private db: LocalDB;

   async init() {
      const str = localStorage.getItem(LS_KEY);
      let data: LocalDB;
      try {
         data = JSON.parse(str);
         if (!data) {
            throw new Error('localStorage has worng value');
         }
         if (data?._version !== import.meta.env.VITE_GIT_COMMIT_HASH) {
            throw new Error('Outdated version of db: ' + data?._version + ' Required: ' + import.meta.env.VITE_GIT_COMMIT_HASH);
         }
         this.db = data;
      }
      catch (e) {
         console.log(e);
         await this.clearCache();
      }
   }

   async getRandUserData() {
      const u = await import('../test-data/lpr').then(x => x.getUser());
      return u;
   }
   async clearCache() {
      console.log('Rewriting database');
      localStorage.clear();
      const user = await this.getRandUserData();
      this.db = clone({ _version: import.meta.env.VITE_GIT_COMMIT_HASH, user });
      localStorage.setItem(LS_KEY, JSON.stringify(this.db));
   }
   async getMyWorkspaces() {
      const workspaces = this.db.user.workspaces;
      return workspaces;
   }
   async getWorkspaceDocuments(wsId: string) {
      const workspaces = await this.getMyWorkspaces();
      const ws = workspaces.find(w => w.id === wsId);
      return ws.documents;
   }
   async getMe() {
      const user = this.db.user;
      return user;
   }
   async updateDocument(doc: BlokiDocument) {
      // Check xss ?
      const workspaces = await this.getMyWorkspaces();
      let originalDoc: BlokiDocument;
      workspaces.forEach(ws => {
         ws.documents.forEach(d => {
            if (d.id === doc.id) {
               originalDoc = d;
               return;
            }
         });
      });

      if (!originalDoc) {
         throw new Error('Document was not found');
      }
      originalDoc.blocks = doc.blocks;
      await this.syncChanges(this.db.user);
   }
   async syncChanges(data: User) {
      localStorage.setItem(LS_KEY, JSON.stringify(this.db));
   }
}