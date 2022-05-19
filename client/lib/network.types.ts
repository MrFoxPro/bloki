import { BlockTransform, PlacementStatus } from "@/modules/bloki-editor/types/blocks";
import { EditType } from "@/modules/bloki-editor/types/editor";

export enum WSMsgType {
   Join = 1,
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

export const CURSOR_UPDATE_RATE = 300;

export type ChangeEventInfo = {
   type: EditType;
   absTransform: BlockTransform;
   relTransform: BlockTransform;
   placement: PlacementStatus;
};
