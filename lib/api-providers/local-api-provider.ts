import { IndexeddbPersistence } from "y-indexeddb";
import { IApiProvider } from "./api-provider.interface";
import { lpr1User, lprWorkspace1 } from "../test-data/lpr";
import { BlokiDocument } from "../entities";

const LS_KEY = 'bloki_data_';

export class TestLocalApiProvider implements IApiProvider {
   provider: IndexeddbPersistence;

   private getOrFillWithDefault<T>(key: string, defaultData: T) {
      const data = localStorage.getItem(LS_KEY + key);
      let result: T;
      if (typeof data === 'string') {
         try {
            result = JSON.parse(data);
            return result;
         }
         catch (e) {
            console.warn('No local data saved for key:', key);
         }
      }
      localStorage.setItem(key, JSON.stringify(defaultData));
      return (window as any).structuredClone(defaultData) as T;
   }
   async getMyWorkspaces() {
      const workspaces = this.getOrFillWithDefault('workspaces', [lprWorkspace1]);
      return workspaces;
   }
   async getWorkspaceDocuments(wsId: string) {
      const workspaces = await this.getMyWorkspaces();
      const ws = workspaces.find(w => w.id === wsId);
      return ws.documents;
   }
   async getMe() {
      const user = this.getOrFillWithDefault('user', lpr1User);
      return user;
   }
   async updateDocument(docId: string, newDoc: BlokiDocument) {
      // const workspaces =
      // const doc = await this.getMyWorkspaces()
      //    .then(wss => wss.filter(ws => ws.documents.find(x => x.id === docId)));
      // if (!doc) {
      //    throw new Error('No such document');
      // }

   }
}