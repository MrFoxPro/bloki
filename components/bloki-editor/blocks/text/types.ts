import { BlockType } from "../../types/blocks";

export type TextSetting = {
   fontSize: number;
   fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
   lineHeight: number;
   color?: string;
};

export const TextTypes = {
   [BlockType.Title]: {
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 58,
   },
   [BlockType.Regular]: {
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 20,
   },
   [BlockType.H1]: {
      fontSize: 30,
      fontWeight: 700,
      lineHeight: 51,
   },
   [BlockType.H2]: {
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 19,
   },
   [BlockType.H3]: {
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 18,
   },
   [BlockType.Description]: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 21,
      color: '#9CA5AB'
   }
} as Record<BlockType, TextSetting>;

export enum TextBlockFontFamily {
   Roboto = 'Roboto',
   Inter = 'Inter'
}