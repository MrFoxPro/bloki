
export type Block = {
   type: 'text';
   value: string;
} | {
   type: 'image';
   value: {
      src: string;
      width: number;
      height: number;
   }
}