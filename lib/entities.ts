import { AnyBlock, Dimension } from "@/components/bloki-editor/types/blocks";
import { BlokiWhiteboard } from "@/components/bloki-editor/types/drawings";

type User = {
   // id: string;
   // name: string;

   // workspaces: Workspace[];
   selectedWorkspaceId: string;
   selectedDocumentId: string;
};
type Workspace = {
   id: string;
   title: string;
   // documents: BlokiDocument[];
   // participants: User[];

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

   shared: boolean;
   layoutOptions: LayoutOptions;
   // blocks: AnyBlock[];
};

export {
   User,
   Workspace,
   LayoutOptions,
   BlokiDocument,
};