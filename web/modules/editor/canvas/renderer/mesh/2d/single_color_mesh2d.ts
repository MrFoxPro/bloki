import { Point2DTupleView } from '@/modules/editor/types'
import { Chunk } from '../../buffer/chunk'
import { BoundingBox2D, Mesh2D, IndexedMeshBase } from '../mesh'

export class SingleColorMesh2D extends IndexedMeshBase implements Mesh2D {
   readonly position: Point2DTupleView
   color = [1, 0, 0, 1]
   clrChunk: Chunk

   public get isAttached() {
      return !!this.group
   }
   public remove() {
      return this.group?.removeMesh(this)
   }
}
