type User = {
   id: string;
   name: string;
};
type CellsOptions = {
   /**
    * in pixels
    */
   gap: number;

   /**
    * in pixels
    */
   size: number;
};
type LayoutOptions = {
   cellsOptions: CellsOptions;
};
type Block = {
   id: string;
   type: 'text';
   value: string;
} | {
   type: 'image';
   value: {
      src: string;
      width: number;
      height: number;
   };
};
type BlokiDocument = {
   title: string;
   layoutOptions: LayoutOptions;
   blocks: Block[],
};
type Workspace = {
   title: string;
   participants: User[];
   documents: BlokiDocument[];
};

export {
   CellsOptions,
   LayoutOptions,
   BlokiDocument,
   Block
};