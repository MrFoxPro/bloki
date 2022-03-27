// import { IndexeddbPersistence } from "y-indexeddb";
import { IApiProvider } from "./api-provider.interface";
import { BlokiDocument, User } from "../entities";

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
         if (data?._version !== import.meta.env.VITE_GIT_COMMIT_HASH) {
            throw new Error('Outdated version of db');
         }
         this.db = data;
      }
      catch (e) {
         await this.clearCache();
      }
   }

   async getRandUserData() {
      const u: User = await import('../test-data/lpr').then(x => x.default);
      return u;
   }
   async clearCache() {
      console.log('Rewriting database');
      localStorage.clear();
      this.db = clone({ _version: import.meta.env.VITE_GIT_COMMIT_HASH, user: await this.getRandUserData() });
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

      // const workspaces =
      const workspace = await this.getMyWorkspaces()
         .then(wss => wss.filter(ws => ws.documents.find(x => x.id === doc.id)));

      if (!workspace) {
         throw new Error('There is no workspace for doucument');
      }
   }
}