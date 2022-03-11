import { IndexeddbPersistence } from "y-indexeddb";
import { User } from "../entities";
import { IApiProvider } from "./api-provider.interface";
import { unwrap } from "solid-js/store";
import { getTestUserWithDocs } from "../test-data/samples";

const LS_DATA_KEY = 'bloki_data';

export class LocalApiProvider implements IApiProvider {
   provider: IndexeddbPersistence;
   constructor() {
      const data = localStorage.getItem(LS_DATA_KEY);
      if (!data) {
         this.syncChanges(getTestUserWithDocs());
      }
   }
   async syncChanges(data: User) {
      console.log('Syncing changes...');
      localStorage.setItem(LS_DATA_KEY, JSON.stringify(unwrap(data)));
   };
   async getMe() {
      const data: User = JSON.parse(localStorage.getItem(LS_DATA_KEY));
      return data;
   }
}