import { Point2DTupleView } from '@/modules/editor/types'
import { BoundingBox2D, IMesh2DBase, IndexedMeshBase } from '../mesh'

export class SingleColorMesh2D extends IndexedMeshBase implements IMesh2DBase {
   readonly position: Point2DTupleView
   readonly color = [1, 0, 0, 1]

   #bounds: BoundingBox2D | null
   bounds() {
      if (this.#bounds) return this.#bounds
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (let i = 1; i < this.vertices.length; i += 2) {
         const x = this.vertices[i - 1]
         const y = this.vertices[i]
         if (x > maxX) maxX = x
         if (x < minX) minX = x

         if (y > maxY) maxY = y
         if (y < minY) minY = y
      }
      this.#bounds = {
         pivot: [minX, minY],
         width: maxX - minX,
         height: maxY - minY,
      }
   }
   public get isAttached() {
      return !!this.group
   }
   public remove() {
      return this.group?.removeMesh(this)
   }
}
