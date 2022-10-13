import { Point2DTupleView } from '../../types'
import { IndexedMeshGroup } from './mesh_group'
import { Chunk } from './pool';

export type BoundingBox2D = {
   pivot: Point2DTupleView
   width: number
   height: number
}
export interface IndexedRenderData {
   vertices: readonly number[]
   indices: readonly number[]
}
export interface Mesh2D {
   bounds(): BoundingBox2D
}

export interface SerializableMesh<TSerialized = Object> extends Mesh2D {
   serialize(): TSerialized
   deserialize(obj: TSerialized): void
}

export class IndexedMesh implements Mesh2D, IndexedRenderData {
   group?: IndexedMeshGroup
   vChunk?: Chunk
   iChunk?: Chunk
   protected _bound?: BoundingBox2D
   constructor(public vertices: readonly number[] = [], public indices: readonly number[] = []) {}
   protected calcBounds() {
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (let i = 1, n = this.vertices.length; i < n; i += 2) {
         const x = this.vertices[i - 1]
         const y = this.vertices[i]
         if (x > maxX) maxX = x
         if (x < minX) minX = x

         if (y > maxY) maxY = y
         if (y < minY) minY = y
      }
      const bounds: BoundingBox2D = {
         pivot: [minX, minY],
         width: maxX - minX,
         height: maxY - minY,
      }
      return bounds
   }
   bounds() {
      if (!this._bound) this._bound = this.calcBounds()
      return this._bound
   }
}
