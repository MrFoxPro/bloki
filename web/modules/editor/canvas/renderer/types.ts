export type TypedArray = Float32Array | Uint32Array
export type TypedArrayConstructor = Float32ArrayConstructor | Uint32ArrayConstructor

export interface IMesh {
   verts: Array<number> | ReadonlyArray<number> | TypedArray
   indices: Array<number> | ReadonlyArray<number> | TypedArray
}
