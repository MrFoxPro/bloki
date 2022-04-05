import { CodeBlockTheme } from "../blocks/code/types";
import { TextBlockFontFamily } from "../blocks/text/types";

type Point = { x: number, y: number; };
type Dimension = { width: number, height: number; };

type BlockTransform = Point & Dimension;

type PlacementStatus = {
   correct: boolean;
   intersections: BlockTransform[];
   outOfBorder: boolean;
   affected: AnyBlock[];
};

enum BlockType {
   Title,
   Regular,
   H1,
   H2,
   H3,
   Description,

   Image,
   Code,
}

type Block = {
   id: string;
   type: BlockType;

   x: number;
   y: number;
   width: number;
   height: number;
};

type ImageBlock = Block & {
   src: string;
   width: number;
   height: number;
};

type TextBlock = Block & {
   value: string;
   fontFamily: TextBlockFontFamily;
};
type CodeBlock = Block & {
   value: string;
   theme: CodeBlockTheme;
};

type AnyBlock = Block | TextBlock | ImageBlock | CodeBlock;

function isTextBlock(block: AnyBlock): block is TextBlock {
   return block?.type < 6;
}

function isImageBlock(block: AnyBlock): block is ImageBlock {
   return block?.type === BlockType.Image;
}

function isCodeBlock(block: AnyBlock): block is CodeBlock {
   return block?.type === BlockType.Code;
}

export {
   Point,
   Dimension,
   BlockTransform,

   PlacementStatus,

   Block,
   BlockType,

   ImageBlock,
   isImageBlock,

   TextBlock,
   isTextBlock,

   CodeBlock,
   isCodeBlock,

   AnyBlock,
};
