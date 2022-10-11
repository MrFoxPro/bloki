import { Point2DTupleView } from '../../../types'
import { Chunk } from '../buffer/chunk'
import { IndexedMeshGroup } from '../mesh_group'

export type BoundingBox2D = {
   pivot: Point2DTupleView
   width: number
   height: number
}

export interface IndexedRenderData {
   vertices: readonly number[]
   indices: readonly number[]
}

export interface IndexedRenderLayout {
   vbo: readonly number[]
   ibo: readonly number[]
}

export interface Mesh2D extends IndexedRenderData {
   bounds(): BoundingBox2D
}

export abstract class IndexedMeshBase implements Mesh2D {
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
      return this.#bounds
   }
   vertices: readonly number[] = []
   indices: readonly number[] = []
   group: IndexedMeshGroup | null
   vChunk: Chunk | null
   iChunk: Chunk | null
   layout: IndexedRenderLayout = {
      vbo: [],
      ibo: [],
   }
}
