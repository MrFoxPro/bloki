import { BlokiDocument, User, Workspace } from "../entities";
import { defaultLayotOptions } from "./layout-options";

const middleX = (defaultLayotOptions.fGridWidth - defaultLayotOptions.mGridWidth) / 2;

const emptyDoc: BlokiDocument = {
   id: 'b99c63e2-e01b-44d0-96b2-a433db2f30ab',
   title: 'Empty',
   layoutOptions: {
      ...defaultLayotOptions,
      showGridGradient: true,
      showResizeAreas: true,
   },
   blocks: [],
};
const geometryHomeworkDoc: BlokiDocument = {
   id: '30273036-fa69-461d-8870-37a9fc5e1156',
   title: 'Geometry homework',
   layoutOptions: defaultLayotOptions,
   blocks: []
};
const lprPlatformDoc: BlokiDocument = {
   id: 'ba76b267-d1b6-4d18-80a0-636c794ef518',
   title: 'Наши принципы',
   layoutOptions: defaultLayotOptions,
   blocks: [
      {
         id: '0821da0a-9eca-4c1a-8e20-ac755d4617ed',
         type: 'text',
         value: 'Либертарианство — политическая и правовая философия, согласно которой человек принадлежит только самому себе и свободен распоряжаться собой и своим имуществом любыми способами, не наносящими прямого ущерба другим людям и их имуществу. Ни другие индивиды, ни коллективы (включая государство) не вправе препятствовать человеку в его свободной ненасильственной деятельности. Отказаться от самопринадлежности невозможно.',
         height: 4,
         width: 4,
         x: middleX,
         y: 4,
      },
      {
         id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
         type: 'text',
         value: 'Частная собственность является институтом, который позволяет людям взаимодействовать в мире ограниченных материальных ресурсов, не совершая насильственных действий. Человек вправе распоряжаться принадлежащим ему имуществом по своему усмотрению без ограничений, если такое использование не наносит прямого ущерба жизни, здоровью и собственности других людей. Никто не может быть лишён своего имущества, если оно приобретено правовым (ненасильственным) способом: куплено, получено в дар (включая наследство), в качестве компенсации за ущерб или приобретено по праву первого владельца.',
         height: 7,
         width: 20,
         x: middleX,
         y: 8,
      },
      {
         id: 'cc4b3ce0-bd2b-4756-b630-746ac372dbfe',
         type: 'text',
         value: 'Государство — это великая фикция, с помощью которой каждый пытается жить за счет всех остальных.',
         height: 3,
         width: 20,
         x: middleX,
         y: 15,
      },
      {
         id: 'c31958ba-8b43-42b1-9064-6ada72e441f4',
         type: 'text',
         value: 'Права объективны, независимы от законов и человеческих договоренностей («естественное право»).',
         height: 2,
         width: 2,
         x: middleX + 5,
         y: 6,
      },
   ],
};

const lprWorkspace1: Workspace = {
   id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
   title: 'Либертарианская партия',
   // participants: [],
};

const lpr1User: User = {
   id: '709240ee-24a7-4fdd-866e-e08206dbb8aa',
   name: 'Михаил Светов',
   selectedWorkspaceId: lprWorkspace1.id,
   selectedDocumentId: lprPlatformDoc.id,
};

// lprWorkspace1.participants.push(lpr1User);

const documents = [
   emptyDoc,
   geometryHomeworkDoc,
   lprPlatformDoc,
];
const users = []
export {
   lpr1User,
   lprPlatformDoc,
   lprWorkspace1
};