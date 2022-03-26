import { BlokiDocument, User, Workspace } from "../entities";

export interface IApiProvider {

   syncChanges?(data: User): Promise<void>;

   getMe(): Promise<User>;

   getMyWorkspaces(): Promise<Workspace[]>;

   getMyDocuments(): Promise<BlokiDocument[]>;

   updateDocument(doc: BlokiDocument): Promise<void>;

}