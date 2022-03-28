import { JSX } from "solid-js";
import { ComponentProps } from "solid-js";
declare module "*.svg" {
   const content: (props: ComponentProps<'svg'>) => JSX.Element;
   export default content;
}
interface ImportMetaEnv {
   [key: string]: string | boolean | undefined;
   BASE_URL: string;
   MODE: string;
   DEV: boolean;
   PROD: boolean;
   SSR: boolean;
   VITE_GIT_COMMIT_DATE: string;
   VITE_GIT_BRANCH_NAME: string;
   VITE_GIT_COMMIT_HASH: string;
   VITE_GIT_LAST_COMMIT_MESSAGE: string;
}