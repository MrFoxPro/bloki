import { getTextBlockSize } from "@/components/bloki-editor/blocks/text-block/helpers";
import { isTextBlock, TextType } from "@/components/bloki-editor/blocks/text-block/types";
import { BlokiDocument, User, Workspace } from "../entities";
import { defaultLayoutOptions } from "./layout-options";

export async function getUser() {

   const middleX = (defaultLayoutOptions.fGridWidth - defaultLayoutOptions.mGridWidth) / 2;
   const gridSize = defaultLayoutOptions.size + defaultLayoutOptions.gap;

   const tutorialDoc: BlokiDocument = {
      id: '98e9eb4a-a2d8-479f-beaa-7aaddd632772',
      title: 'Intro',
      blocks: [
         {
            id: 'af110e09-2cf0-4d7a-8867-aa9b4238227d',
            type: 'text',
            textType: TextType.Title,
            value: '# title example',
         },
         {
            id: '00c604f1-0aa8-41d8-9d25-9006e3305320',
            type: 'text',
            textType: TextType.H1,
            value: '# H1 пример Заголовок'
         },
         {
            id: 'db0c3192-e813-4a23-a438-735e2690ab8f',
            type: 'text',
            value: '# H2 пример Заголовок',
            textType: TextType.H2,
         },
         {
            id: '8712c3ce-30ec-4fc7-9b99-ee9aadc3d8c0',
            type: 'text',
            value: '# H3 пример Заголовок',
            textType: TextType.H3,
         },
         {
            id: '83df9986-6e50-4f87-a8e4-5620620a14a7',
            type: 'text',
            value: '# text пример текст',
            textType: TextType.Regular,
         },
         {
            id: '9b591c88-9a62-438a-8679-87257c2cf8b2',
            type: 'text',
            value: '# подпись пример',
            textType: TextType.Description
         }
      ].map((block, i, arr) => {
         block.width = defaultLayoutOptions.mGridWidth;
         block.x = middleX;
         if (isTextBlock(block)) {
            const { width, height } = getTextBlockSize(block, block.value, defaultLayoutOptions, block.width);
            block.width = width;
            block.height = height;
         }
         if (block.y === undefined) {
            block.y = i > 0 ? (arr[i - 1].y + arr[i - 1].height) : 5;
         }
         return block;
      }),
      layoutOptions: { ...defaultLayoutOptions, fGridHeight: 160 },
   };
   const emptyDoc: BlokiDocument = {
      id: 'b99c63e2-e01b-44d0-96b2-a433db2f30ab',
      title: 'Empty',
      layoutOptions: { ...defaultLayoutOptions, showGridGradient: true },
      blocks: [],
   };
   const lprPlatformDoc: BlokiDocument = {
      id: 'ba76b267-d1b6-4d18-80a0-636c794ef518',
      title: 'Наши принципы',
      layoutOptions: { ...defaultLayoutOptions },
      blocks: [
         {
            id: '0821da0a-9eca-4c1a-8e20-ac755d4617ed',
            type: 'text',
            value: 'Либертарианство — политическая и правовая философия, согласно которой человек принадлежит только самому себе и свободен распоряжаться собой и своим имуществом любыми способами, не наносящими прямого ущерба другим людям и их имуществу. Ни другие индивиды, ни коллективы (включая государство) не вправе препятствовать человеку в его свободной ненасильственной деятельности. Отказаться от самопринадлежности невозможно.',
            x: middleX,
         },
         {
            id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
            type: 'text',
            value: 'Частная собственность является институтом, который позволяет людям взаимодействовать в мире ограниченных материальных ресурсов, не совершая насильственных действий. Человек вправе распоряжаться принадлежащим ему имуществом по своему усмотрению без ограничений, если такое использование не наносит прямого ущерба жизни, здоровью и собственности других людей. Никто не может быть лишён своего имущества, если оно приобретено правовым (ненасильственным) способом: куплено, получено в дар (включая наследство), в качестве компенсации за ущерб или приобретено по праву первого владельца.',
            x: middleX,
         },
         {
            id: 'cc4b3ce0-bd2b-4756-b630-746ac372dbfe',
            type: 'text',
            value: 'Государство — это великая фикция, с помощью которой каждый пытается жить за счет всех остальных.',
            x: middleX,
         },
         {
            id: 'c31958ba-8b43-42b1-9064-6ada72e441f4',
            type: 'text',
            value: 'Права объективны, независимы от законов и человеческих договоренностей («естественное право»).',
            x: middleX,
         },
         {
            id: '7e0a7f62-7373-4d2a-b899-2d91f08496e5',
            type: 'image',
            src: 'https://www.solidjs.com/assets/logo.123b04bc.svg',
            x: middleX,
            width: 15,
            height: 15
         },
         {
            id: '9fcc2c06-dffd-4542-a9ad-7f483c868f69',
            type: 'image',
            src: `https://cataas.com/cat?width=${defaultLayoutOptions.mGridWidth * gridSize}&height=${gridSize * 20}`,
            x: middleX,
            width: defaultLayoutOptions.mGridWidth,
            height: 20
         }
      ].map((block, i, arr) => {
         block.width = defaultLayoutOptions.mGridWidth;
         if (isTextBlock(block)) {
            block.textType = TextType.Regular;
            const { width, height } = getTextBlockSize(block, block.value, defaultLayoutOptions, block.width);
            block.width = width;
            block.height = height;
         }
         if (block.y === undefined) {
            block.y = i > 0 ? (arr[i - 1].y + arr[i - 1].height) : 20;
         }
         return block;
      }),
   };
   const lprWorkspace1: Workspace = {
      workspaceIcon: await import('./assets/sample-workspace-icon2.png?inline').then(x => x.default),
      id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
      title: 'Bloki workspace',
      documents: [
         tutorialDoc,
         emptyDoc,
         lprPlatformDoc,
      ],
      participants: [],
   };

   const lpr1User: User = {
      id: '709240ee-24a7-4fdd-866e-e08206dbb8aa',
      name: 'Михаил Светов',
      workspaces: [lprWorkspace1],
      selectedWorkspace: lprWorkspace1,
      selectedDocument: tutorialDoc,
   };
   return lpr1User;
}