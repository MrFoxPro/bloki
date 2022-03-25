import { boolean } from "yup";

type User = {
   id: string;
   name: string;
};
type Workspace = {
   id: string;
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

   showGridGradient: boolean;
   showResizeAreas: boolean;
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
   type: 'text';
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
   workspaceId?: string;
   layoutOptions: LayoutOptions;
   blocks: AnyBlock[],
};
type AnyBlock = Block | TextBlock | ImageBlock;

export {
   User,
   Workspace,
   LayoutOptions,
   BlokiDocument,
   Block,
   BlockType,
   TextBlock,
   ImageBlock,

   AnyBlock,
};