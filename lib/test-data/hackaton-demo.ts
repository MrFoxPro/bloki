import { calculateBlockSize } from "@/components/bloki-editor/blocks/text-block";
import { TextBlockFontFamily, TextTypes } from "@/components/bloki-editor/blocks/text-block/types";
import { getGoodImageRelativeSize } from "@/components/bloki-editor/helpers";
import { BlokiDocument, TextBlock, User, Workspace } from "../entities";
import { defaultLayoutOptions } from "./layout-options";

export async function getUser() {
   const middleX = (defaultLayoutOptions.fGridWidth - defaultLayoutOptions.mGridWidth) / 2;

   // const tutorialDoc: BlokiDocument = {
   //    id: '98e9eb4a-a2d8-479f-beaa-7aaddd632772',
   //    title: 'Intro',
   //    blocks: [
   //       {
   //          id: 'af110e09-2cf0-4d7a-8867-aa9b4238227d',
   //          type: 'text',
   //          x: middleX,
   //          y: 0,
   //          height: 1,
   //          fontFamily: TextBlockFontFamily.Inter,
   //          textType: TextTypes.
   //       }
   //       {
   //          id: '00c604f1-0aa8-41d8-9d25-9006e3305320',
   //          x: middleX,
   //          y: 0,
   //       }
   //    ],
   //    layoutOptions: { ...defaultLayoutOptions },
   // };
   const emptyDoc: BlokiDocument = {
      id: 'b99c63e2-e01b-44d0-96b2-a433db2f30ab',
      title: 'Empty',
      layoutOptions: { ...defaultLayoutOptions, showGridGradient: true },
      blocks: [],
   };
   const geometryHomeworkDoc: BlokiDocument = {
      id: '30273036-fa69-461d-8870-37a9fc5e1156',
      title: 'Geometry homework',
      layoutOptions: defaultLayoutOptions,
      blocks: [
         {
            id: '60f1e5a2-5996-4580-8c3c-9deaa81f6e31',
            type: 'text',
            value: 'Дано:',
            x: 5,
            y: 5,
            height: 1,
            width: 4,
         },
         {
            id: '60f1e5a2-5996-4580-8c3c-9deaa81f6e31',
            type: 'text',
            value: `ABCD — параллелограмм;`,
            x: 5,
            y: 6,
            height: 1,
            width: 4,
         },

      ]
   };
   const gridSize = defaultLayoutOptions.size + defaultLayoutOptions.gap;
   const lprPlatformDoc: BlokiDocument = {
      id: 'ba76b267-d1b6-4d18-80a0-636c794ef518',
      title: 'Наши принципы',
      layoutOptions: { ...defaultLayoutOptions, fGridHeight: 150, mGridHeight: 150 },
      blocks: [
         {
            id: '0821da0a-9eca-4c1a-8e20-ac755d4617ed',
            type: 'text',
            value: 'Либертарианство — политическая и правовая философия, согласно которой человек принадлежит только самому себе и свободен распоряжаться собой и своим имуществом любыми способами, не наносящими прямого ущерба другим людям и их имуществу. Ни другие индивиды, ни коллективы (включая государство) не вправе препятствовать человеку в его свободной ненасильственной деятельности. Отказаться от самопринадлежности невозможно.',
            x: middleX,
            y: 4,
         },
         {
            id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
            type: 'text',
            value: 'Частная собственность является институтом, который позволяет людям взаимодействовать в мире ограниченных материальных ресурсов, не совершая насильственных действий. Человек вправе распоряжаться принадлежащим ему имуществом по своему усмотрению без ограничений, если такое использование не наносит прямого ущерба жизни, здоровью и собственности других людей. Никто не может быть лишён своего имущества, если оно приобретено правовым (ненасильственным) способом: куплено, получено в дар (включая наследство), в качестве компенсации за ущерб или приобретено по праву первого владельца.',
            x: middleX,
            y: 8,
         },
         {
            id: 'cc4b3ce0-bd2b-4756-b630-746ac372dbfe',
            type: 'text',
            value: 'Государство — это великая фикция, с помощью которой каждый пытается жить за счет всех остальных.',
            x: middleX,
            y: 15,
         },
         {
            id: 'c31958ba-8b43-42b1-9064-6ada72e441f4',
            type: 'text',
            value: 'Права объективны, независимы от законов и человеческих договоренностей («естественное право»).',
            x: middleX,
            y: 6,
         },
         {
            id: '7e0a7f62-7373-4d2a-b899-2d91f08496e5',
            type: 'image',
            src: 'https://www.solidjs.com/assets/logo.123b04bc.svg',
            x: middleX,
            width: defaultLayoutOptions.mGridWidth,
            height: 30
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
         block.y = i > 0 ? (arr[i - 1].y + arr[i - 1].height) : 0;
         if (block.type === 'text') {
            const { width, height } = calculateBlockSize(block as TextBlock, defaultLayoutOptions);
            block.width = width;
            block.height = height;
         }
         return block;
      }),
   };
   const lprWorkspace1: Workspace = {
      workspaceIcon: await import('./assets/sample-workspace-icon2.png?inline').then(x => x.default),
      id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
      title: 'Bloki workspace',
      documents: [
         emptyDoc,
         geometryHomeworkDoc,
         lprPlatformDoc,
      ],
      participants: [],
   };

   const lpr1User: User = {
      id: '709240ee-24a7-4fdd-866e-e08206dbb8aa',
      name: 'Михаил Светов',
      workspaces: [lprWorkspace1],
      selectedWorkspace: lprWorkspace1,
      selectedDocument: lprPlatformDoc,
   };
   return lpr1User;
}