import { AnyBlock, ImageBlock } from "@/lib/entities";
import { Dimension } from "../types";
import { TextBlock } from "./text-block/types";

export type ContentBlockProps<T = AnyBlock> = {
   block: T;

   isMeEditing: boolean;

   isMeDragging: boolean;
   isMeResizing: boolean;

   onContentDimensionChange?(size: Dimension): void;

};