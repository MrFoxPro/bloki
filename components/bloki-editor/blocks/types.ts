import { AnyBlock, ImageBlock } from "@/lib/entities";
import { Dimension } from "../types";

export type ContentBlockProps<T = AnyBlock> = {
   block: T;

   isMeEditing: boolean;

   isMeDragging: boolean;
   isMeResizing: boolean;

   onContentDimensionChange?(size: Dimension): void;
};

export const contentBlockProps: (keyof ContentBlockProps<AnyBlock>)[] = ['block', 'isMeDragging', 'isMeEditing', 'isMeResizing', 'onContentDimensionChange'];