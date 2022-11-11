declare global {
   const GIT_COMMIT_DATE: string
   const GIT_BRANCH_NAME: string
   const GIT_COMMIT_HASH: string
   const GIT_LAST_COMMIT_MESSAGE: string
}
import type { AttributifyAttributes } from 'unocss/preset-attributify'
declare module 'solid-js' {
   namespace JSX {
      interface HTMLAttributes<T> extends AttributifyAttributes {}
   }
}
