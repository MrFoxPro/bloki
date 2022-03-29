import { AnyBlock, ImageBlock } from "@/lib/entities";
import { BlockTransform, Dimension } from "../types";

export type ContentBlockProps<T = AnyBlock> = {
   block: T;

   isMeEditing: boolean;
   isMeDragging: boolean;
   isMeResizing: boolean;
   setGetContentDimension(f: (transform: Dimension) => Dimension): void;

   shadowed?: boolean;
   localTransform: BlockTransform;

};

export const contentBlockProps: (keyof ContentBlockProps<AnyBlock>)[] = [
   'block',
   'isMeDragging',
   'isMeEditing',
   'isMeResizing',
   'setGetContentDimension',
   'shadowed',
   'localTransform'
];