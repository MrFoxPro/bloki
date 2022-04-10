import { BlockTransform, PlacementStatus } from "@/components/bloki-editor/types/blocks";
import { EditType } from "@/components/bloki-editor/types/editor";
import { BlokiDocument } from "./entities";

export enum WSMsgType {
   Join,
   CursorUpdate,
   Roommates,
   Blob,
   Layout,
   ChangeEnd,
   SelectBlock,
   CreateBlock,
   DeleteBlock,
   ChangeBlock,
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

export type ChangeEventInfo = {
   type: EditType;
   absTransform: BlockTransform;
   relTransform: BlockTransform;
   placement: PlacementStatus;
};