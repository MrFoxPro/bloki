import { Point2DArray, Point2DTupleView } from '@/modules/editor/types'
import { SingleColorMesh2D } from '../../mesh/2d/single_color_mesh2d'
import { ELEMENT_PER_VERTEX } from '../../utils'
import { ObjectKind } from '../object_kind'
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

export type FatLineStyle = {
   width: number
   cap: LineCap
   join: LineJoin
   miterLimit: number
   alignment: number
   closePointEps: number
}
export class FatLine2D extends SingleColorMesh2D {
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
   readonly shape = {
      closeStroke: false,
      type: ObjectKind.POLY,
   }

   constructor(public points: Point2DArray = [], style?: FatLineStyle) {
      super()
      this.style = style ?? this.style

      if (this.points.length) this.build()

      // this.addSegment(this.points)

      // this.vertices = mesh.vertices
      // this.indices = mesh.indices
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
   lineTo(p: Point2DTupleView) {
      this.points.push(...p)
      if (this.points.length > 6) this.build()
   }
   build() {
      const splined = getCurvePoints(this.points, CARDINAL_TENSION, CARDINAL_SEGEMENTS, false)
      const mesh = FatLineBuilder.build(Array.from(splined), this.style)
      const vbo: number[] = []
      for (let i = 1; i < mesh.vertices.length; i += 2) {
         vbo.push(mesh.vertices[i - 1], mesh.vertices[i], ...this.color)
      }
      this.layout.vbo = vbo
      this.layout.ibo = mesh.indices
      if (!this.isAttached) return
      this.vChunk.splice(0, this.layout.vbo.length, ...this.layout.vbo)
      this.iChunk.splice(0, this.layout.ibo.length, ...this.layout.ibo)

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
