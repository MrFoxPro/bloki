import { User } from "../entities";
import { testDoc1 } from "./documents";
import { testUser1, testUser2 } from "./users";

export function getTestUserWithDocs(): User {
   return {
      ...testUser1,
      workspaces: [
         {
            title: 'District Operations Associate',
            participants: [testUser1, testUser2],
            documents: [
               testDoc1,
            ]
         }
      ]
   };
}