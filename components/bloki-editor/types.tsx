import { TextBlockFontFamily } from "./blocks/text-block/types";

type Point = { x: number, y: number; };
type Dimension = { width: number, height: number; };
type EditType = 'drag' | 'resize' | 'select' | 'content';

type BlockTransform = Point & Dimension;

enum Instrument {
   Cursor,
   Pencil,
   Pen,
   Marker,
   Lastik,
   Circle,
   Triangle,
   Rect
}

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

type AnyBlock = Block | TextBlock | ImageBlock;

function isTextBlock(block: AnyBlock): block is TextBlock {
   return block?.type < 6;
}

function isImageBlock(block: AnyBlock): block is ImageBlock {
   return block?.type === BlockType.Image;
}

// unify with Instrument?
enum DrawingType {
   Marker,
   Circle,
   Lastik
}

enum DrawingColor {
   Red = '#c0392b',
   Blue = '#4281FA',
   Green = '#4DE56F',
   Purple = '#D949FD',
   Cyan = '#79EFFF',
}

class Drawing {
   public color: DrawingColor;
   public strokeWidth: number;
};
class MarkerDrawing extends Drawing {
   points: Point[];
}
class CircleDrawing extends Drawing {
   center: Point;
   radius: number;
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
   isImageBlock,

   TextBlock,
   isTextBlock,

   AnyBlock,

   Instrument,
   Drawing,
   DrawingType,
   DrawingColor,

   MarkerDrawing,
   CircleDrawing,
};
