// SAME AS IN ./config.scss

export const DEFAULT_GRID_CELL_SIZE_PX = 24;
export const DEFAULT_GRID_CELL_GAP_PX = 4;
export const DEFAULT_MAIN_GRID_FACTOR = 20;
export const DEFAULT_FOREGROUND_GRID_FACTOR = 56;
export const DEFAULT_GRID_HEIGHT = 30;

export function gridSize(factor: number, size = DEFAULT_GRID_CELL_SIZE_PX, gap = DEFAULT_GRID_CELL_GAP_PX) {
   return factor * (size + gap) - gap;
}