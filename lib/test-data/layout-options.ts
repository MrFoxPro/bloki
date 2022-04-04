import { LayoutOptions } from "../entities";

export const defaultLayoutOptions: LayoutOptions = {
   fGridWidth: 3 * 26 + 2,
   fGridHeight: 45,

   mGridHeight: 45,
   mGridWidth: 26,

   gap: 4,
   size: 16,

   blockMinSize: {
      width: 1,
      height: 1,
   },
   blockMaxSize: {
      width: 45,
      height: 45,
   },
   showGridGradient: false,
   showResizeAreas: false,
};