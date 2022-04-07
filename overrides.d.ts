declare module "*.svg" {
   const content: (props: ComponentProps<'svg'>) => JSX.Element;
   export default content;
}

declare interface ImportMetaEnv {
   VITE_GIT_COMMIT_DATE: string;
   VITE_GIT_BRANCH_NAME: string;
   VITE_GIT_COMMIT_HASH: string;
   VITE_GIT_LAST_COMMIT_MESSAGE: string;
}
