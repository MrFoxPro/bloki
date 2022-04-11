import { LayoutOptions } from "../../lib/entities";

export const defaultLayoutOptions: LayoutOptions = {
   // 3 * 26 + 2
   fGridWidth: 80,
   fGridHeight: 130,

   mGridHeight: 130,
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