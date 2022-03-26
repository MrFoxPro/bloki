export type Point = { x: number, y: number; };
export type Dimension = { width: number, height: number; };
export type EditType = 'drag' | 'resize' | 'select' | 'content';

export type BlockTransform = Point & Dimension;

export type Intersection = {
   startX: number;
   width: number;
   startY: number;
   height: number;
};
export type PlacementStatus = {
   correct: boolean;
   intersections: Intersection[];
   outOfBorder: boolean;
};
export type ChangeEventInfo = {
   type: EditType;
   absTransform: BlockTransform;
   relTransform: BlockTransform;
   placement: PlacementStatus;
};
