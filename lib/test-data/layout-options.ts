import { LayoutOptions } from "../entities";

export const DEFAULT_CELL_SIZE_PX = 16;
export const DEFAULT_CELL_GAP_PX = 4;
// in figma it is 26
export const DEFAULT_MAIN_GRID_WIDTH_FACTOR = 26;
export const DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR = 3 * DEFAULT_MAIN_GRID_WIDTH_FACTOR + 2;
export const DEFAULT_GRID_HEIGHT_FACTOR = 45;

// const BLOCK_MIN_WIDTH = 1;
// const BLOCK_MIN_HEIGHT = 1;

// const BLOCK_MAX_WIDTH = 45;
// const BLOCK_MAX_HEIGHT = 45;

export const defaultLayoutOptions: LayoutOptions = {
   fGridWidth: DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR,
   fGridHeight: DEFAULT_GRID_HEIGHT_FACTOR,

   mGridHeight: DEFAULT_GRID_HEIGHT_FACTOR,
   mGridWidth: DEFAULT_MAIN_GRID_WIDTH_FACTOR,

   gap: DEFAULT_CELL_GAP_PX,
   size: DEFAULT_CELL_SIZE_PX,

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