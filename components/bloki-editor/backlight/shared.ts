import { JSX } from "solid-js";
import { PlacementStatus, BlockTransform, Point } from "../types";

export type CachedPlacement = Pick<PlacementStatus, 'intersections' | 'affected'> & { block: BlockTransform; };

export enum CellState {
   None,
   Free,
   Intersection,
   Affected
}

export interface IGridImpl {
   component: JSX.Element;
   drawArea(transform: BlockTransform, fillState: CellState | ((x: number, y: number) => CellState));
   clearArea(transform: BlockTransform);
}

export const FillColors: Record<CellState, string> = {
   [CellState.None]: 'transparent',
   [CellState.Free]: '#EDF3FF',
   [CellState.Intersection]: '#D8DEE9',
   [CellState.Affected]: '#F4F4F4'
};