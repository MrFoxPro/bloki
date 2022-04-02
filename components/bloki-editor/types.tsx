import { TextBlockStyle } from "./blocks/text-block/types";

type Point = { x: number, y: number; };
type Dimension = { width: number, height: number; };
type EditType = 'drag' | 'resize' | 'select' | 'content';

type BlockTransform = Point & Dimension;

type PlacementStatus = {
   correct: boolean;
   intersections: BlockTransform[];
   outOfBorder: boolean;
   affected: AnyBlock[];
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

type TextBlock = Block & {
   type: 'text';
   value: string;
} & TextBlockStyle;

type AnyBlock = Block | TextBlock | ImageBlock;

function isTextBlock(block: AnyBlock): block is TextBlock {
   return block.type === 'text';
}

export {
   Point,
   Dimension,
   BlockTransform,

   PlacementStatus,
   EditType,

   Block,
   BlockType,

   ImageBlock,

   TextBlock,
   isTextBlock,

   AnyBlock
};
