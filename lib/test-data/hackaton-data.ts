// import { CodeBlockTheme } from "@/components/bloki-editor/blocks/code/types";
// import { BlockType } from "@/components/bloki-editor/types/blocks";
import { BlokiDocument, User, Workspace } from "../entities";
import { defaultLayoutOptions } from "./layout-options";

// import { TextBlockFontFamily } from "@/components/bloki-editor/blocks/text/types";
// import { plainToInstance } from "class-transformer";
// import { BlokiWhiteboard } from "@/components/bloki-editor/types/drawings";

const middleX = (defaultLayoutOptions.fGridWidth - defaultLayoutOptions.mGridWidth) / 2;
const gridSize = defaultLayoutOptions.size + defaultLayoutOptions.gap;

const introDoc: BlokiDocument = {
   id: 'd07cac49-f0ab-402e-989b-12789000ec2a',
   title: 'Intro',
   shared: false,
   blocks: [
      {
         "id": "af110e09-2cf0-4d7a-8867-aa9b4238227d",
         "type": 0,
         "value": "All your creativity in one place",
         "x": 35,
         "y": 2,
         "width": 19,
         "height": 6
      },
      {
         "id": "00c604f1-0aa8-41d8-9d25-9006e3305320",
         "type": 2,
         "value": "Bloki is an interactive block editor in which you can create anything you want whether it's a math homework or work",
         "x": 3,
         "y": 8,
         "width": 26,
         "height": 11
      },
      {
         "id": "148a40a4-09f5-4449-965b-58779b30c344",
         "type": 6,
         "src": null,
         "x": 27,
         "y": 94,
         "width": 26,
         "height": 16
      },
      {
         "id": "14af581f-2598-4b4f-bbbe-46220e1cd32f",
         "type": 6,
         "src": "https://i.imgur.com/UUtfVyL.png",
         "x": 64,
         "y": 61,
         "width": 13,
         "height": 3
      },
      {
         "type": 2,
         "value": "To create a block, simply click in the center of the space, the pre-lighting will show you the block you will create",
         "fontFamily": "Inter",
         "height": 16,
         "width": 15,
         "x": 61,
         "y": 30,
         "id": "1ceb74a4-993c-4907-b91a-71d8b20b49df"
      },
      {
         "type": 2,
         "value": "The block can be set to the size whatever you want. To change drag the edge of the block selection and pull the circle, it's very simple ☺️ ",
         "fontFamily": "Inter",
         "height": 13,
         "width": 26,
         "x": 0,
         "y": 48,
         "id": "a9f5d6b8-1acb-4420-ae64-2894f8b616e8"
      },
      {
         "type": 2,
         "value": "Move the block to the place you need",
         "fontFamily": "Inter",
         "height": 5,
         "width": 26,
         "x": 45,
         "y": 51,
         "id": "51d8f340-b8fb-46d3-8366-7bf936b3f14e"
      },
      {
         "type": 1,
         "value": "The block backlight will change if the selected position is unavailable ",
         "fontFamily": "Inter",
         "height": 4,
         "width": 12,
         "x": 64,
         "y": 57,
         "id": "d0c77b8b-d1f6-40b0-b417-25f880b21a3c"
      },
      {
         "type": 2,
         "value": "You can change the block type by right-clicking         and selecting the type",
         "fontFamily": "Inter",
         "height": 8,
         "width": 26,
         "x": 0,
         "y": 78,
         "id": "eb8867ec-afbd-45cc-a1de-9dac6148bf90"
      },
      {
         "type": 2,
         "value": "You can choose the pencil tool and start drawing right on top of the text blocks ☺️ Wow! Give it a try!",
         "fontFamily": "Inter",
         "height": 9,
         "width": 26,
         "x": 12,
         "y": 123,
         "id": "87870267-05a1-4b33-a8a5-21e846b44d44"
      },
      {
         "type": 2,
         "value": "You have a great level of freedom when editing files and everything fits into a text editor with its own file structure, workspaces, and collaboration.",
         "fontFamily": "Inter",
         "height": 14,
         "width": 26,
         "x": 43,
         "y": 144,
         "id": "48cdef1b-9a01-4b57-9680-8db71e7aa6e2"
      },
      {
         "type": 3,
         "value": "https://i.imgur.com/rdgXmun.png",
         "fontFamily": "Inter",
         "height": 3,
         "width": 13,
         "x": 55,
         "y": 99,
         "color": "#4281FA",
         "id": "8d9910c2-d1ae-4b86-80e6-010ca3a59cc1"
      }
   ],
   layoutOptions: { ...defaultLayoutOptions, fGridHeight: 160, mGridHeight: 160 },
};

const emptyDoc: BlokiDocument = {
   id: 'b99c63e2-e01b-44d0-96b2-a433db2f30ab',
   title: 'Try it!',
   layoutOptions: { ...defaultLayoutOptions, showGridGradient: true },
   blocks: [],
   shared: true,
};

const hackWorkspace: Workspace = {
   workspaceIcon: '../../assets/favicon-32x32.png',
   id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
   title: 'Bloki workspace',
};

const hackatonUser: User = {
   workspaces: [hackWorkspace],
   selectedWorkspaceId: hackWorkspace.id,
   selectedDocumentId: introDoc.id,
};
export { hackatonUser, hackWorkspace, introDoc, emptyDoc };
export default hackatonUser;