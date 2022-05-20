import { JSX } from "solid-js";
import { BlockTransform } from "../types/blocks";

export enum CellState {
   None = 1,
   Free,
   Intersection,
   Affected
}

export interface IGridImpl {
   component: () => JSX.Element;
   drawArea(transform: BlockTransform, fillState: CellState | ((x: number, y: number) => CellState));
   clearArea(transform: BlockTransform);
}

export const FillColors: Record<CellState, string> = {
   [CellState.None]: 'transparent',
   [CellState.Free]: '#EDF3FF',
   [CellState.Intersection]: '#DA4929',
   [CellState.Affected]: '#e6e612'
};