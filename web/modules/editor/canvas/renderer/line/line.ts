import { Point2DTupleView, Point2DArray } from '@/modules/editor/types'
import { Mesh } from '../mesh'
import { buildNativeLine, buildNonNativeLine, SHAPES } from './algo'
import { LINE_CAP, LINE_JOIN } from './algo'
import { getCurvePoints } from './cardinal_spline'

export type LineStyle = {
   /** The width (thickness) of any lines drawn. */
   width: number
   /** Miter limit. */
   miterLimit: number
   /** The alignment of any lines drawn (0.5 = middle, 1 = outer, 0 = inner). WebGL only. */
   alignment: number
   cap: LINE_CAP
   join: LINE_JOIN
   /** If true the lines will be draw using LINES instead of TRIANGLE_STRIP. */
   native: boolean

   cardinal?: {
      tension: number
      numOfSeg: number
   }
}

export function computeLineMesh(points: Point2DArray, lineStyle: LineStyle) {
   if (lineStyle.cardinal) {
      const interpolated = getCurvePoints(
         points,
         lineStyle.cardinal.tension,
         lineStyle.cardinal.numOfSeg,
         false
      )
      points = Array.from(interpolated)
   }
   const geometry = {
      closePointEps: 1e-4,
      verts: [] as number[],
      indices: [] as number[],
      lineStyle,
   }
   const graphics = {
      shape: {
         closeStroke: false,
         type: SHAPES.POLY,
      },
      points,
      lineStyle,
   }

   lineStyle.native ? buildNativeLine(graphics, geometry) : buildNonNativeLine(graphics, geometry)

   return {
      verts: geometry.verts,
      indices: geometry.indices,
   }
}

export class Line extends Mesh {
   anchor: Point2DTupleView = [0, 0]
   points: Point2DArray = []
   style: LineStyle = {
      width: 3,
      miterLimit: 0.1,
      alignment: 0.1,
      cap: LINE_CAP.SQUARE,
      join: LINE_JOIN.BEVEL,
      native: false,
      cardinal: {
         numOfSeg: 4,
         tension: 0.5,
      },
   }
   _color = [1, 0, 0, 1]
   constructor(points: Point2DArray = [], style?: LineStyle) {
      super()
      this.points = points
      this.style ??= style
      if (this.points) {
         this.buildMesh()
      }
   }
   moveTo(p: Point2DTupleView) {
      this.anchor = p
      this.addPoint(p)
      // this.points.push(...p)
   }
   lineTo(p: Point2DTupleView) {
      // this.points.push(...p)
      this.addPoint(p)
   }
   get color() {
      return this._color
   }
   set color(c) {
      this._color = c
      this.buildMesh()
   }
   private addPoint(p: Point2DTupleView) {
      this.points.push(...p)
      if (this.points.length < 6) return
      this.buildMesh()
   }
   public override buildMesh() {
      const mesh = computeLineMesh(this.points, this.style)
      const verts = []
      for (let i = 1; i < mesh.verts.length; i += 2) {
         verts.push(mesh.verts[i - 1], mesh.verts[i], ...this._color)
      }
      this.verts = verts
      this.indices = mesh.indices
   }
}
