declare global {
   function structuredClone<T>(obj: T): T
   interface Number {
      px: string
   }
}
declare module 'solid-js' {
   namespace JSX {
      interface HTMLAttributes {
         /**
          * Pointer for playwright tests
          */
         pw?: string
      }
   }
}

export {}
