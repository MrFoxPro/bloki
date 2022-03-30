import { Block } from "@/lib/entities";

export const TextTypes = {
   Regular: {
      fontSize: 16,
      fontWeight: 14
   },
   Title: {
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 58
   },
} as const;

export enum TextBlockFontFamily {
   Roboto = 'Roboto',
   Inter = 'Inter'
}

export type TextBlock = Block & {
   type: 'text';
   textType: typeof TextTypes[keyof typeof TextTypes];
   fontFamily: TextBlockFontFamily;
   value: string;
};