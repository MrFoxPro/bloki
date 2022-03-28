import { BlokiDocument, User, Workspace } from "../entities";

export interface IApiProvider {

   init(): Promise<void>;
   syncChanges?(data: User): Promise<void>;

   getMe(): Promise<User>;

   getMyWorkspaces(): Promise<Workspace[]>;

   // getMyDocuments(): Promise<BlokiDocument[]>;

   updateDocument(doc: BlokiDocument): Promise<void>;
   // createDocument(ws: Workspace, doc: BlokiDocument): Promise<void>;

   clearCache(): Promise<void>;



}