// SAME AS IN ./config.scss

export const GRID_CELL_SIZE_PX = 24;
export const GRID_CELL_GAP_PX = 4;
export const MAIN_GRID_FACTOR = 20;
export const FOREGROUND_GRID_FACTOR = 56;

export function gridSize(factor: number, size = GRID_CELL_SIZE_PX, gap = GRID_CELL_GAP_PX) {
   return factor * (size + gap) - gap;
}