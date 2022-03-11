type User = {
   id: string;
   name: string;
   workspaces?: Workspace[];
};
type Workspace = {
   title: string;
   participants: User[];
   documents: BlokiDocument[];
};
type LayoutOptions = {
   gap: number;
   size: number;

   mGridWidth: number;
   mGridHeight: number;

   fGridWidth: number;
   fGridHeight: number;
};
type BlockType = 'text' | 'image';
type Block = {
   id: string;
   type: BlockType;

   x: number;
   y: number;
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
   id: string;
   title: string;
   layoutOptions: LayoutOptions;
   blocks: Block[],
};

export {
   User,
   Workspace,
   LayoutOptions,
   BlokiDocument,
   Block,
   BlockType,
   TextBlock,
   ImageBlock,
};