import { Block } from "@/lib/entities";

export const TextTypes = {
   Regular: {
      fontSize: 16,
      fontWeight: 14
   }
} as const;

export enum TextBlockFontFamily {
   Roboto = 'Roboto'
}

export type TextBlock = Block & {
   type: 'text';
   textType: typeof TextTypes[keyof typeof TextTypes];
   fontFamily: TextBlockFontFamily;
   value: string;
};