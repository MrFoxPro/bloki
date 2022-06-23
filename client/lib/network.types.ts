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
