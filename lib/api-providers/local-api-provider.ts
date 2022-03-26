// import { IndexeddbPersistence } from "y-indexeddb";
import { IApiProvider } from "./api-provider.interface";
import { BlokiDocument } from "../entities";
import { ITestDB, testDB1 } from "../test-data/test-db";

const LS_KEY = 'bloki_data';

function clone<T>(obj: T) {
   if ((window as any).structuredClone) {
      return (window as any).structuredClone(obj) as T;
   }
   else return JSON.parse(JSON.stringify(obj)) as T;
}

export class TestLocalApiProvider implements IApiProvider {
   private db: ITestDB;
   constructor() {
      const str = localStorage.getItem(LS_KEY);
      let data: ITestDB;
      try {
         data = JSON.parse(str);
         if (data?._version !== import.meta.env.VITE_GIT_COMMIT_HASH) {
            throw new Error('Outdated version');
         }
         this.db = data;
      }
      catch (e) {
         console.log('Rewriting database');
         this.db = data = clone(testDB1);
         localStorage.clear();
         localStorage.setItem(LS_KEY, JSON.stringify(this.db));
      }
   }
   async getMyWorkspaces() {
      const userWorkspacesIds = this.db.user_workspace_map.filter(x => x.userId === this.db.user.id).map(x => x.workspaceId);
      return this.db.workspaces.filter(x => userWorkspacesIds.includes(x.id));
   }
   async getMyDocuments() {
      const myWorkspacesIds = await this.getMyWorkspaces().then((wss) => wss.map(x => x.id));

      const documentIds = this.db.workspace_document_map.filter(x => myWorkspacesIds.includes(x.workspaceId)).map(x => x.documentId);

      return this.db.documents.filter(x => documentIds.includes(x.id));
   }
   async getMe() {
      const user = this.db.user;
      return user;
   }
   async updateDocument(doc: BlokiDocument) {
      const ind = this.db.documents.findIndex(d => d.id === doc.id);
      if (ind) {
         this.db.documents[ind] = clone(doc);
      }
      else throw new Error('No document with id ' + doc.id);
   }
}