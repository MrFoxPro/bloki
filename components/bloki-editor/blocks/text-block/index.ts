import { LayoutOptions, TextBlock } from "@/lib/entities";
import { Dimension } from "../../types";
import { DOMTextMeasurer } from "./measure-text-dom";
import { TextBlockFontFamily } from "./types";

export function calculateBlockSize(block: TextBlock, layoutOptions: LayoutOptions): Dimension {
   if (!block.textType) block.textType = { ...block.textType };
   const gridSize = layoutOptions.size + layoutOptions.gap;
   const measurer = new DOMTextMeasurer();
   measurer.setOptions({
      fontFamily: block.fontFamily ?? TextBlockFontFamily.Inter,
      fontSize: block.textType.fontSize + 'px',
      fontWeight: block.textType.fontWeight + 'px',
      lineHeight: gridSize + 'px',
   });
   const size = measurer.measureText(block.value, layoutOptions.mGridWidth * (gridSize) - layoutOptions.gap + 'px');
   console.log(block.value, size);
   size.width = Math.ceil(size.width / gridSize);
   size.height = Math.ceil(size.height / gridSize);
   measurer.dispose();
   return size;
}