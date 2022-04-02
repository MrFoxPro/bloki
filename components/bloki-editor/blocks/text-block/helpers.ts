import { LayoutOptions } from "@/lib/entities";
import { calcGridSize } from "../../helpers";
import { Dimension } from "../../types";
import { DOMTextMeasurer } from "./measure-text-dom";
import { TextBlockFontFamily, TextBlockStyle, TextType, TextTypes } from "./types";

export const measurer = new DOMTextMeasurer();
const HeightMargins = {
   [TextType.H1]: 1,
};

export type GridInfo = Pick<LayoutOptions, 'gap' | 'size'>;

export function getTextBlockSize(
   { textType, fontFamily }: TextBlockStyle,
   text: string, { size, gap }: GridInfo,
   maxRelWidth?: number,
   overflowWrap: 'anywhere' | 'break-word' = 'break-word'): Dimension & { isOneLine: boolean; } {
   const gridSize = size + gap;

   const settings = TextTypes[textType];

   let isOneLine: boolean;

   measurer.setOptions({
      fontFamily: fontFamily ?? TextBlockFontFamily.Inter,
      fontSize: settings.fontSize + 'px',
      fontWeight: settings.fontWeight.toString(),
      lineHeight: settings.lineHeight + 'px',
      overflowWrap
   });
   let maxAbsWidth = maxRelWidth ? calcGridSize(maxRelWidth, size, gap) + 'px' : 'auto';
   let { width, height } = measurer.measureText(text, maxAbsWidth);

   width += gap;
   // height += gap;

   isOneLine = height < settings.lineHeight * 2;
   let heightRel: number, widthRel: number;

   if (isOneLine) heightRel = Math.ceil(settings.fontSize / size);
   else heightRel = Math.ceil(height / gridSize);

   widthRel = Math.ceil(width / gridSize);

   if (HeightMargins[textType]) heightRel += HeightMargins[textType];

   // console.log(text, TextType[textType], width + 'px', height + 'px', widthRel, heightRel, 'is one line?', isOneLine);

   return { width: widthRel, height: heightRel, isOneLine };
}