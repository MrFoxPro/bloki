export { }

declare global {
   export const GIT_COMMIT_DATE: string
   export const GIT_BRANCH_NAME: string
   export const GIT_COMMIT_HASH: string
   export const GIT_LAST_COMMIT_MESSAGE: string
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
