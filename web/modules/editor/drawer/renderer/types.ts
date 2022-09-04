import { Transform } from '../../types'
import { LINE_CAP, LINE_JOIN, Point } from '../line'

export type TypedArray =
   | Int8Array
   | Uint8Array
   | Uint8ClampedArray
   | Int16Array
   | Uint16Array
   | Int32Array
   | Uint32Array
   | Float32Array
   | Float64Array

export type TypedArrayConstructor =
   | Int8ArrayConstructor
   | Uint8ArrayConstructor
   | Uint8ClampedArrayConstructor
   | Int16ArrayConstructor
   | Uint16ArrayConstructor
   | Int32ArrayConstructor
   | Uint32ArrayConstructor
   | Float32ArrayConstructor
   | Float64ArrayConstructor

export type LineStyle = {
   width: number
   miterLimit: number
   alignment: number
   cap: LINE_CAP
   join: LINE_JOIN
   color: [r: number, g: number, b: number, a: number]
}

export type Mesh = {
   vertices: number[]
   indices: number[]
}

export type Figure = {
   bound: Transform
   points: Point[]
}
