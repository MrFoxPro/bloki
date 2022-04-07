import { BlokiDocument } from "./entities";

export enum WSMsgType {
   Join,
   CursorUpdate,
   Roommates
}
export type WSMsg = { type: WSMsgType; data: any; };

export type Roommate = {
   name: string;
   color: string;
   cursor: {
      x: number;
      y: number;
   };
   workingBlockId?: string;
};

export type BlokiNetworkDocument = BlokiDocument & {
   shared: boolean;
   willResetAtUnix: number;
};

export const CURSOR_UPDATE_RATE = 400;