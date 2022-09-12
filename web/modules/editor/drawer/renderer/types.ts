import { LINE_CAP, LINE_JOIN } from './line/algo'

export type TypedArray = Float32Array | Uint32Array
export type TypedArrayConstructor = Float32ArrayConstructor | Uint32ArrayConstructor

export type LineStyle = {
   width: number
   miterLimit: number
   alignment: number
   cap: LINE_CAP
   join: LINE_JOIN
}

export interface IMesh {
   verts: Array<number> | ReadonlyArray<number> | TypedArray
   indices: Array<number> | ReadonlyArray<number> | TypedArray
}
