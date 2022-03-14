import { BlokiDocument, User, Workspace } from "../entities";
import { defaultLayotOptions } from "./layout-options";

const lpr1User: User = {
   id: '709240ee-24a7-4fdd-866e-e08206dbb8aa',
   name: 'Михаил Светов',
};

const lprPlatformDoc: BlokiDocument = {
   id: 'ba76b267-d1b6-4d18-80a0-636c794ef518',
   title: 'Наши принципы',
   layoutOptions: defaultLayotOptions,
   blocks: [
      {
         id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
         type: 'text',
         value: 'Либертарианство — политическая и правовая философия, согласно которой человек принадлежит только самому себе и свободен распоряжаться собой и своим имуществом любыми способами, не наносящими прямого ущерба другим людям и их имуществу. Ни другие индивиды, ни коллективы (включая государство) не вправе препятствовать человеку в его свободной ненасильственной деятельности. Отказаться от самопринадлежности невозможно.',
         height: 4,
         width: 8,
         x: 0,
         y: 0,
      },
      {
         id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
         type: 'text',
         value: 'Частная собственность является институтом, который позволяет людям взаимодействовать в мире ограниченных материальных ресурсов, не совершая насильственных действий. Человек вправе распоряжаться принадлежащим ему имуществом по своему усмотрению без ограничений, если такое использование не наносит прямого ущерба жизни, здоровью и собственности других людей. Никто не может быть лишён своего имущества, если оно приобретено правовым (ненасильственным) способом: куплено, получено в дар (включая наследство), в качестве компенсации за ущерб или приобретено по праву первого владельца.',
         height: 4,
         width: 8,
         x: 9,
         y: 5,
      },
   ],
};

const lprWorkspace1: Workspace = {
   id: '4b95b2ef-b80e-4cb3-9ed2-e9aa2311f56f',
   title: 'Либертарианская партия',
   documents: [
      lprPlatformDoc,
   ],
   participants: [lpr1User],
};

export {
   lpr1User,
   lprPlatformDoc,
   lprWorkspace1
};