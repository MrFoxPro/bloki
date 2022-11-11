declare global {
   function structuredClone<T>(obj: T): T
}

declare module 'solid-js' {
   namespace JSX {
      interface HTMLAttributes<T> {
         /**
          * Pointer for playwright tests
          */
         pw?: string
      }
   }
}

export {}
