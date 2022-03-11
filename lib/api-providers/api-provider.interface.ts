import { AppStoreValues } from "../app.store";
import { User } from "../entities";

export interface IApiProvider {

   syncChanges(data: User): Promise<void>;

   getMe(): Promise<User>;
}