import { calcGridSize } from '../../helpers'
import { BlockType, Dimension } from '../../misc'
import { DOMTextMeasurer } from './measure-text-dom'
import { TextBlockFontFamily, TextTypes } from './types'

export const measurer = new DOMTextMeasurer()
const HeightMargins = {
   [BlockType.H1]: 1,
}

export type GridInfo = Pick<LayoutOptions, 'gap' | 'size'>

export function getTextBlockSize(
   blockTextType: BlockType,
   fontFamily: TextBlockFontFamily,
   text: string,
   { size, gap }: GridInfo,
   maxRelWidth?: number,
   overflowWrap: 'anywhere' | 'break-word' = 'break-word'
): Dimension & { isOneLine: boolean } {
   const gridSize = size + gap

   const settings = TextTypes[blockTextType]

   let isOneLine: boolean

   measurer.setOptions({
      fontFamily: fontFamily ?? TextBlockFontFamily.Inter,
      fontSize: settings.fontSize.px,
      fontWeight: settings.fontWeight.toString(),
      lineHeight: settings.lineHeight.px,
      overflowWrap,
   })
   let maxAbsWidth = maxRelWidth ? calcGridSize(maxRelWidth, size, gap).px : 'auto'
   let { width, height } = measurer.measureText(text, maxAbsWidth)

   width += gap
   // height += gap;

   isOneLine = height < settings.lineHeight * 2
   let heightRel: number, widthRel: number

   if (isOneLine) heightRel = Math.ceil(settings.fontSize / size)
   else heightRel = Math.ceil(height / gridSize)

   widthRel = Math.ceil(width / gridSize)

   if (HeightMargins[blockTextType]) heightRel += HeightMargins[blockTextType]

   return { width: widthRel, height: heightRel, isOneLine }
}
