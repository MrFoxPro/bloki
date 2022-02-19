type User = {
   id: string;
   name: string;
};
type LayoutOptions = {
   gap: number;
   size: number;

   mGridWidth: number;
   mGridHeight: number;

   fGridWidth: number;
   fGridHeight: number;
};
type BlockType = 'text' | 'image'
type Block = {
   id: string;
   type: BlockType;
   width: number;
   height: number;
};
type TextBlock = Block & {
   value: string;
};
type ImageBlock = Block & {
   type: 'image';
   src: string;
   width: number;
   height: number;
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
   Workspace,
   LayoutOptions,
   BlokiDocument,
   Block,
   BlockType,
   TextBlock,
   ImageBlock,
};