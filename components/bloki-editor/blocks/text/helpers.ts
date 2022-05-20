import { LayoutOptions } from "@/lib/entities";
import { calcGridSize } from "../../helpers";
import { BlockType, Dimension, TextBlock } from "../../types/blocks";
import { DOMTextMeasurer } from "./measure-text-dom";
import { TextBlockFontFamily, TextTypes } from "./types";

export const measurer = new DOMTextMeasurer();
export const HeightMargins = {
   [BlockType.H1]: 1,
};

export function getTextOneLineHeight(type: BlockType, gridCellSize: number) {
   const { fontSize } = TextTypes[type];
   return Math.ceil(fontSize / gridCellSize);
}

export type GridInfo = Pick<LayoutOptions, 'gap' | 'size'>;

export const createTextBlockResizeHelper = ({ size, gap }: Pick<LayoutOptions, 'gap' | 'size'>) => {

   return function getTextBlockSize(block: TextBlock, text: string, options: Partial<CSSStyleDeclaration> = {}): Dimension & { isOneLine: boolean; } {
      const gridSize = size + gap;

      const settings = TextTypes[block.type];

      let isOneLine: boolean;

      options = Object.assign({
         fontFamily: block.fontFamily,
         fontSize: settings.fontSize + 'px',
         lineHeight: settings.lineHeight + 'px',
         fontWeight: settings.fontWeight,
      }, options);
      let { width, height } = measurer.measureText(text, options);

      width += gap;
      // height += gap;

      isOneLine = height < settings.lineHeight * 2;
      let heightRel: number, widthRel: number;

      if (isOneLine) heightRel = getTextOneLineHeight(block.type, size);
      else heightRel = Math.ceil(height / gridSize);

      widthRel = Math.ceil(width / gridSize);

      if (HeightMargins[block.type]) heightRel += HeightMargins[block.type];

      // console.log(text, TextType[textType], width + 'px', height + 'px', widthRel, heightRel, 'is one line?', isOneLine);

      return { width: widthRel, height: heightRel, isOneLine };
   };
};

export function getCurrentCursorPosition(parentElement) {
   let selection = window.getSelection(),
      charCount = -1,
      node;

   if (selection.focusNode) {
      if (isChildOf(selection.focusNode, parentElement)) {
         node = selection.focusNode;
         charCount = selection.focusOffset;

         while (node) {
            if (node === parentElement) {
               break;
            }

            if (node.previousSibling) {
               node = node.previousSibling;
               charCount += node.textContent.length;
            } else {
               node = node.parentNode;
               if (node === null) {
                  break;
               }
            }
         }
      }
   }
   return charCount;
}

export function setCurrentCursorPosition(chars, element) {
   if (chars >= 0) {
      var selection = window.getSelection();

      let range = createRange(element, { count: chars }, null);

      if (range) {
         range.collapse(false);
         selection.removeAllRanges();
         selection.addRange(range);
      }
   }
}

function createRange(node, chars, range) {
   if (!range) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
   }

   if (chars.count === 0) {
      range.setEnd(node, chars.count);
   } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
         if (node.textContent.length < chars.count) {
            chars.count -= node.textContent.length;
         } else {
            range.setEnd(node, chars.count);
            chars.count = 0;
         }
      } else {
         for (var lp = 0; lp < node.childNodes.length; lp++) {
            range = createRange(node.childNodes[lp], chars, range);

            if (chars.count === 0) {
               break;
            }
         }
      }
   }

   return range;
}

function isChildOf(node, parentElement) {
   while (node !== null) {
      if (node === parentElement) {
         return true;
      }
      node = node.parentNode;
   }
   return false;
}

