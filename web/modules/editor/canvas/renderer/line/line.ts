import { Point2DTupleView, Point2DArray } from '@/modules/editor/types'
import { Mesh } from '../mesh'
import { LineStyle } from '../types'
import { buildNonNativeLine, SHAPES } from './algo'
import { LINE_CAP, LINE_JOIN } from './algo'

export function computeLineMesh(points: Point2DArray, lineStyle: LineStyle) {
   const geometry = {
      closePointEps: 1e-4,
      verts: [] as number[],
      indices: [] as number[],
      lineStyle,
   }
   buildNonNativeLine(
      {
         shape: {
            closeStroke: false,
            type: SHAPES.POLY,
         },
         points,
         lineStyle,
      },
      geometry
   )
   return {
      verts: geometry.verts,
      indices: geometry.indices,
   }
}

export class Line extends Mesh {
   anchor: Point2DTupleView = [0, 0]
   points: Point2DArray = []
   style: LineStyle = {
      width: 5,
      miterLimit: 0.1,
      alignment: 0.1,
      cap: LINE_CAP.ROUND,
      join: LINE_JOIN.ROUND,
   }
   _color = [1, 0, 0, 1]
   constructor()
   constructor(points: Point2DArray = [], style?: LineStyle) {
      super()
      this.points = points
      this.style ??= style
      if (this.points) {
         this.calcMesh()
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
      this.calcMesh()
   }
   private addPoint(p: Point2DTupleView) {
      this.points.push(...p)
      if (this.points.length < 6) return
      this.calcMesh()
   }
   private calcMesh() {
      const mesh = computeLineMesh(this.points, this.style)
      const verts = []
      for (let i = 1; i < mesh.verts.length; i += 2) {
         verts.push(mesh.verts[i - 1], mesh.verts[i], ...this._color)
      }
      this.verts = verts
      this.indices = mesh.indices
   }
}
