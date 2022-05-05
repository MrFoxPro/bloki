import globalClassNames, { ClassNames as GlobalClassNames } from "..style.d";
declare const classNames: typeof globalClassNames & {
  readonly buildInfo: "buildInfo";
};
export default classNames;
export type ClassNames = "buildInfo" | GlobalClassNames;
