import { LayoutOptions } from "../entities";
import {
   DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR,
   DEFAULT_GRID_HEIGHT_FACTOR,
   DEFAULT_MAIN_GRID_WIDTH_FACTOR,
   DEFAULT_CELL_GAP_PX,
   DEFAULT_CELL_SIZE_PX
} from "./editor-settings";

export const defaultLayotOptions: LayoutOptions = {
   fGridWidth: DEFAULT_FOREGROUND_GRID_WIDTH_FACTOR,
   fGridHeight: DEFAULT_GRID_HEIGHT_FACTOR,

   mGridHeight: DEFAULT_GRID_HEIGHT_FACTOR,
   mGridWidth: DEFAULT_MAIN_GRID_WIDTH_FACTOR,

   gap: DEFAULT_CELL_GAP_PX,
   size: DEFAULT_CELL_SIZE_PX,
   showGridGradient: false,
   showResizeAreas: false,
};