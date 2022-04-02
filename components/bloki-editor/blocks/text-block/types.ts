export enum TextType {
   Title,
   Regular,
   H1,
   H2,
   H3,
   Description,
}
type TextSetting = {
   fontSize: number;
   fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
   lineHeight: number;
   color?: string;
};

export const TextTypes: { [key in TextType]: TextSetting } = {
   [TextType.Title]: {
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 58,
   },
   [TextType.Regular]: {
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 20,
   },
   [TextType.H1]: {
      fontSize: 30,
      fontWeight: 700,
      lineHeight: 51,
   },
   [TextType.H2]: {
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 19,
   },
   [TextType.H3]: {
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 18,
   },
   [TextType.Description]: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 21,
      color: '#9CA5AB'
   }
};
export enum TextBlockFontFamily {
   Roboto = 'Roboto',
   Inter = 'Inter'
}

export type TextBlockStyle = {
   textType: TextType;
   fontFamily?: TextBlockFontFamily;
};