import { Point2DArray, Point2DTupleView } from '@/modules/editor/types'
import { IndexedMesh, Mesh2D, SerializableMesh } from '../../mesh'
import { Chunk } from '../../pool';
import { FatLineBuilder } from './fat/builder'
import { getCurvePoints } from './processing/cardinal_spline'

export enum LineJoin {
   Miter,
   Bevel,
   Round,
}
export enum LineCap {
   Butt,
   Round,
   Sqaure,
}

const CARDINAL_SEGEMENTS = 4
const CARDINAL_TENSION = 0.5

type RGBAColorArray = [number, number, number, number]
export type FatLineStyle = {
   width: number
   cap: LineCap
   join: LineJoin
   miterLimit: number
   alignment: number
   closePointEps: number
}
type FatLine2DSerialized = {
   points: number[]
   style: FatLine2D['style']
   color: RGBAColorArray
}

export class FatLine2D extends IndexedMesh implements Mesh2D, SerializableMesh<FatLine2DSerialized> {
   /** The width (thickness) of any lines drawn. */
   readonly style: FatLineStyle = {
      width: 3,
      cap: LineCap.Sqaure,
      join: LineJoin.Bevel,

      /** Miter limit. */
      miterLimit: 0.1,
      /** The alignment of any lines drawn (0.5 = middle, 1 = outer, 0 = inner). WebGL only. */
      alignment: 0.1,
      closePointEps: 1e-4,
   }
   readonly position: Point2DTupleView
   color: RGBAColorArray = [1, 0, 0, 1]
   clrChunk: Chunk
   clrBindGroup: GPUBindGroup
   constructor(public points: Point2DArray = [], style?: FatLineStyle) {
      super()
      Object.assign(this.style, style)
   }
   // addSegment(segment: Point2DArray) {
   //    const splined = getCurvePoints(segment, CARDINAL_TENSION, CARDINAL_SEGEMENTS, false)
   //    const mesh = FatLineBuilder.build(Array.from(splined), this.style)

   //    const vbo: number[] = []
   //    for (let i = 1; i < mesh.vertices.length; i += 2) {
   //       vbo.push(mesh.vertices[i - 1], mesh.vertices[i], ...this.color)
   //    }
   //    this.vertices = this.vertices.concat()
   // }
   get isAttached() {
      return !!this.group
   }
   serialize() {
      return { points: this.points, style: this.style, color: this.color }
   }
   deserialize({ points, color, style }: FatLine2DSerialized) {
      this.points = points
      this.color = color
      Object.assign(this.style, style)
      this.build()
   }
   remove() {
      return this.group?.removeMesh(this)
   }
   lineTo(p: Point2DTupleView) {
      this.points.push(...p)
      if (this.points.length > 6) this.build()
   }
   build() {
      const splined = getCurvePoints(this.points, CARDINAL_TENSION, CARDINAL_SEGEMENTS, false)
      const mesh = FatLineBuilder.build(Array.from(splined), this.style)
      // const vbo: number[] = []
      // for (let i = 1; i < mesh.vertices.length; i += 2) {
      //    vbo.push(mesh.vertices[i - 1], mesh.vertices[i], ...this.color)
      // }

      if (!this.isAttached) return
      this.vChunk.splice(0, mesh.vertices.length, ...mesh.vertices)
      this.iChunk.splice(0, mesh.indices.length, ...mesh.indices)
      this.clrChunk.splice(0, this.color.length, ...this.color)
      // setInterval(() => {
      //    const clr = new Array(4).fill(0)
      //    for (let i = 0; i < 3; i++) {
      //       clr[i] = Math.random()
      //    }
      //    this.clrChunk?.splice(0, 4, ...clr)
      // }, 1500)
      // const baseVert = this.vchunk.offset / ELEMENT_PER_VERTEX
      // this.iChunk.splice(0, this.layout.ibo.length, ...this.layout.ibo.map((i) => baseVert + i))
   }
   // http://www.idav.ucdavis.edu/education/CAGDNotes/Chaikins-Algorithm/Chaikins-Algorithm.html
   // public optimize(tolerance: number = 1) {
   //    const twon: Point2DTupleView[] = []
   //    for (let i = 1; i < this.points.length; i += 2) {
   //       twon.push([this.points[i - 1], this.points[i]])
   //    }
   //    const result = simplify(twon, tolerance)
   //    const before = this.points.length
   //    this.points = result.flat()
   //    const d = before - this.points.length
   //    console.log(d / 2, 'points were removed')
   //    this.buildMesh()
   // }
}

export const SingleColorStrokeShaderCode = /*wgsl*/ `
   @binding(0) @group(0) var<uniform> viewport : vec4<f32>;
   @binding(0) @group(1) var<uniform> color : vec4<f32>;

   @vertex
   fn vertex(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
      var out: vec4<f32>;
      out = vec4(position.xy, 0.0, 1.0) / viewport;
      return out;
   }

   @fragment
   fn fragment() -> @location(0) vec4<f32> {
      return color;
   }
`
