import { DEFAULT_GRID_CELL_GAP_PX, DEFAULT_GRID_CELL_SIZE_PX, DEFAULT_GRID_HEIGHT, DEFAULT_MAIN_GRID_FACTOR } from "./config";
import { Block, BlokiDocument } from "./entities";


export const testLayout1: Block[] = [
   {
      id: '620b2cb4-d175-4f1f-9bf1-bc5a42d15c6f',
      type: 'text',
      value: 'Мы вынуждены отталкиваться от того, что выбранный нами инновационный путь однозначно определяет каждого участника как способного принимать собственные решения касаемо дальнейших направлений развития.'
   },
   {
      id: '2331c430-8300-4248-a65a-a6b4388c3c5d',
      type: 'text',
      value: 'С другой стороны сложившаяся структура организации в значительной степени обуславливает создание новых предложений. С другой стороны рамки и место обучения кадров в значительной степени обуславливает создание дальнейших направлений развития. Не следует, однако забывать, что реализация намеченных плановых заданий в значительной степени обуславливает создание существенных финансовых и административных условий. Разнообразный и богатый опыт постоянный количественный рост и сфера нашей активности требуют от нас анализа существенных финансовых и административных условий.'
   },
];

export const testDocument1: BlokiDocument = {
   title: 'Untitled 1',
   layoutOptions: {
      cellsOptions: {
         gap: DEFAULT_GRID_CELL_GAP_PX,
         size: DEFAULT_GRID_CELL_SIZE_PX,
      },
   },
   blocks: testLayout1,
};

