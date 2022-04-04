import { AnyBlock, Dimension, Drawing } from "@/components/bloki-editor/types";

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

type BlokiDocument = {
   id: string;
   title: string;

   layoutOptions: LayoutOptions;
   blocks: AnyBlock[];
   drawings: Drawing[];
};

export {
   User,
   Workspace,
   LayoutOptions,
   BlokiDocument,
};