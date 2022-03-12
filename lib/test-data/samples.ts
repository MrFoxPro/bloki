import { User } from "../entities";
import { testDoc1 } from "./documents";
import { testUser1, testUser2 } from "./users";

export function getTestUserWithDocs(): User {
   return {
      ...testUser1,
      workspaces: [
         {
            id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
            title: 'District Operations Associate',
            participants: [testUser1, testUser2],
            documents: [
               testDoc1,
            ]
         }
      ]
   };
}