import { BlokiDocument, User, Workspace } from "../entities";

export interface IApiProvider {

   syncChanges?(data: User): Promise<void>;

   getMe(): Promise<User>;

   getMyWorkspaces(): Promise<Workspace[]>;

   getWorkspaceDocuments(wsId: string): Promise<BlokiDocument[]>;

   // getMyDocuments(): Promise<BlokiDocument[]>;

   updateDocument(docId: string, doc: BlokiDocument): Promise<void>;

}