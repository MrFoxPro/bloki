import { Point2DTupleView, Point2DArray } from '@/modules/editor/types'
import { Mesh } from '../chunk_system/mesh'
import { LineStyle } from '../types'
import { defaultLineStyle, computeLineMesh } from '../utils'

export class Line extends Mesh {
   anchor: Point2DTupleView = [0, 0]
   points: Point2DArray = []
   style: LineStyle = structuredClone(defaultLineStyle)
   _color = [1, 0.5, 0, 1]
   constructor()
   constructor(points?: Point2DArray)
   constructor(points: Point2DArray = []) {
      super()
      this.points = points
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
      if (this.points.length < 4) return
      this.calcMesh()
   }
   private calcMesh() {
      const mesh = computeLineMesh(this.points, this.style)
      if(mesh.verts.includes(NaN)) {
         console.warn('There are nans')
         return
      }
      const verts = []
      for (let i = 1; i < mesh.verts.length; i += 2) {
         verts.push(mesh.verts[i - 1], mesh.verts[i], ...this._color)
      }
      this.verts = verts
      this.indices = mesh.indices
   }
}
