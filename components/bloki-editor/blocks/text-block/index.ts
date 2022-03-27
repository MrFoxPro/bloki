import { LayoutOptions, TextBlock } from "@/lib/entities";
import { Dimension } from "../../types";
import { measureText } from "./measure-text-dom";
import { TextBlockFontFamily } from "./types";

export function calculateBlockSize(block: TextBlock, layoutOptions: LayoutOptions): Dimension {
   if (!block.textType) block.textType = { ...block.textType };

   const gridSize = layoutOptions.size + layoutOptions.gap;
   const size = measureText(block.value, {
      fontFamily: block.fontFamily ?? TextBlockFontFamily.Roboto,
      fontSize: block.textType.fontSize + 'px',
      fontWeight: block.textType.fontWeight + 'px',
      lineHeight: gridSize + 'px',
      width: layoutOptions.mGridWidth * (gridSize) - layoutOptions.gap + 'px'
   });
   console.log(block.value, size);
   size.width = Math.ceil(size.width / gridSize);
   size.height = Math.ceil(size.height / gridSize);
   return size;
}