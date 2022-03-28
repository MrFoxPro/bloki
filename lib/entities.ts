import { TextBlock } from "@/components/bloki-editor/blocks/text-block/types";
import { Dimension } from "@/components/bloki-editor/types";

type User = {
   id: string;
   name: string;

   workspaces: Workspace[];
   selectedWorkspace?: Workspace;
   selectedDocument?: BlokiDocument;
};
type Workspace = {
   id: string;
   title: string;
   documents: BlokiDocument[];
   participants: User[];

   workspaceIcon: string;
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

   blockMinSize: Dimension;
   blockMaxSize: Dimension;
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

type ImageBlock = Block & {
   type: 'image';
   src: string;
   width: number;
   height: number;
};
type BlokiDocument = {
   id: string;
   title: string;
   // workspaceId?: string;
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