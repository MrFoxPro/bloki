import { Point2DTupleView } from '../../../types'
import { Chunk } from '../buffer/chunk'
import { IndexedMeshGroupBase } from '../mesh_group'

export type BoundingBox2D = {
   pivot: Point2DTupleView
   width: number
   height: number
}

export interface IIndexedRenderData {
   vertices: readonly number[]
   indices: readonly number[]
}

export interface IIndexedRenderLayout {
   vbo: readonly number[]
   ibo: readonly number[]
}

export interface IMesh2DBase {
   bounds(): BoundingBox2D
}

export abstract class IndexedMeshBase implements IIndexedRenderData {
   vertices: readonly number[] = []
   indices: readonly number[] = []
   group: IndexedMeshGroupBase | null
   vChunk: Chunk | null
   iChunk: Chunk | null
   layout: IIndexedRenderLayout = {
      vbo: [],
      ibo: [],
   }
}
