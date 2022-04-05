import { User, Workspace, BlokiDocument } from "../entities";
import { IApiProvider } from "./api-provider.interface";

export class TestNetApiProvider implements IApiProvider {
   host: string;
   fetch = (path, ...args) => window.fetch(this.host + path, ...args);
   async init() {
      this.host = import.meta.env.DEV ? 'http://127.0.0.1/:3005' : 'https://bloki.app/api';
   }

   async getMe() {
      // return this.fetch('/me').then(x => x.json()) as ;
   }

   getMyWorkspaces() {
      throw new Error("Method not implemented.");
   }

   async syncChanges(data: User) {
      throw new Error("Method not implemented.");
   }

   async updateDocument(doc: BlokiDocument) {
      throw new Error("Method not implemented.");
   }

   async clearCache() {
      throw new Error("Method not implemented.");
   }
}