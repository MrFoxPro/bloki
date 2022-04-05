import { BlockType } from "@/components/bloki-editor/types/blocks";
import { BlokiDocument, User, Workspace } from "../entities";
import { defaultLayoutOptions } from "./layout-options";

const middleX = (defaultLayoutOptions.fGridWidth - defaultLayoutOptions.mGridWidth) / 2;
const gridSize = defaultLayoutOptions.size + defaultLayoutOptions.gap;

const tutorialDoc: BlokiDocument = {
   id: '98e9eb4a-a2d8-479f-beaa-7aaddd632772',
   title: 'Intro',
   blocks: [
      {
         id: 'af110e09-2cf0-4d7a-8867-aa9b4238227d',
         type: BlockType.Title,
         value: '# title example',
         x: middleX,
         y: 0,
         width: defaultLayoutOptions.mGridWidth,
         height: 3,
      },
      {
         id: '00c604f1-0aa8-41d8-9d25-9006e3305320',
         type: BlockType.H1,
         value: '# H1 пример Заголовок',
         x: middleX,
         y: 5,
         width: defaultLayoutOptions.mGridWidth,
         height: 2,
      },
      {
         id: 'db0c3192-e813-4a23-a438-735e2690ab8f',
         type: BlockType.H2,
         value: '# H2 пример Заголовок',
         x: middleX,
         y: 7,
         width: defaultLayoutOptions.mGridWidth,
         height: 2,
      },
      {
         id: '8712c3ce-30ec-4fc7-9b99-ee9aadc3d8c0',
         type: BlockType.H3,
         value: '# H3 пример Заголовок',
         x: middleX,
         y: 9,
         width: defaultLayoutOptions.mGridWidth,
         height: 2,
      },
      {
         id: '83df9986-6e50-4f87-a8e4-5620620a14a7',
         type: BlockType.Regular,
         value: '# text пример текст',
         x: middleX,
         y: 11,
         width: defaultLayoutOptions.mGridWidth,
         height: 1,
      },
      {
         id: '9b591c88-9a62-438a-8679-87257c2cf8b2',
         type: BlockType.Description,
         value: '# подпись пример',
         x: middleX,
         y: 12,
         width: defaultLayoutOptions.mGridWidth,
         height: 1,
      },
      {
         id: '38d759e0-9412-4473-94da-d68eff45c845',
         type: BlockType.Image,
         src: 'https://www.anypics.ru/download.php?file=201211/1280x1024/anypics.ru-38999.jpg',
         x: middleX,
         y: 13,
         width: defaultLayoutOptions.mGridWidth,
         height: 21
      },
      {
         id: '148a40a4-09f5-4449-965b-58779b30c344',
         type: BlockType.Image,
         src: null,
         x: middleX,
         y: 34,
         width: defaultLayoutOptions.mGridWidth,
         height: defaultLayoutOptions.mGridWidth * 2 / 3
      },
   ],
   drawings: [],
   layoutOptions: { ...defaultLayoutOptions, fGridHeight: 160, mGridHeight: 160 },
};
const emptyDoc: BlokiDocument = {
   id: 'b99c63e2-e01b-44d0-96b2-a433db2f30ab',
   title: 'Empty',
   layoutOptions: { ...defaultLayoutOptions, showGridGradient: true },
   blocks: [],
   drawings: [],
};
const hackWorkspace: Workspace = {
   workspaceIcon: await import('./assets/sample-workspace-icon2.png?inline').then(x => x.default),
   id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
   title: 'Bloki workspace',
   documents: [
      tutorialDoc,
      emptyDoc,
   ],
   participants: [],
};

const lpr1User: User = {
   id: '709240ee-24a7-4fdd-866e-e08206dbb8aa',
   name: 'Михаил Светов',
   workspaces: [hackWorkspace],
   selectedWorkspace: hackWorkspace,
   selectedDocument: tutorialDoc,
};
export default lpr1User;