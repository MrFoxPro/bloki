import { BlockTransform, PlacementStatus } from "@/modules/bloki-editor/types/blocks";
import { EditType } from "@/modules/bloki-editor/types/editor";

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
