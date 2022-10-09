import { Pool } from './buffer/pool'
import { IndexedMeshBase } from './mesh/mesh'
import {
   VBO_ARRAY,
   IBO_ARRAY,
   INDEX_FORMAT,
   TypedArray,
   ELEMENT_PER_VERTEX,
   VBO_CHUNK_LENGTH,
   IBO_CHUNK_LENGTH,
} from './utils'

export abstract class IndexedMeshGroupBase {
   vbo: Pool
   ibo: Pool
   readonly objects = new Set<IndexedMeshBase>()
   constructor(device: GPUDevice) {
      this.vbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new Pool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   protected abstract initChunks(mesh: IndexedMeshBase): void
   protected abstract draw(pass: GPURenderPassEncoder): void
   public addMesh(mesh: IndexedMeshBase) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   public removeMesh(mesh: IndexedMeshBase) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.vChunk = null
         mesh.iChunk.remove()
         mesh.vChunk = null
         return mesh
      }
   }
   public recordRenderPass(pass: GPURenderPassEncoder) {
      if (!this.shouldRender) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      this.draw(pass)
   }
   public get shouldRender() {
      return this.objects.size > 0
   }
}

export class TightIndexedMeshGroup extends IndexedMeshGroupBase {
   protected override initChunks(mesh: IndexedMeshBase) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      this.align_ibo(mesh)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
   }
   private align_ibo(mesh: IndexedMeshBase) {
      const baseVert = mesh.vChunk.offset / ELEMENT_PER_VERTEX
      mesh.layout.ibo = mesh.indices.map((index) => baseVert + index)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      pass.drawIndexed(this.ibo.array.length, 1)
   }
}

export class PiecewiseIndexedMeshGroup extends IndexedMeshGroupBase {
   protected override initChunks(mesh: IndexedMeshBase) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      for (const mesh of this.objects) {
         pass.drawIndexed(mesh.iChunk.length, 1, mesh.iChunk.offset, mesh.vChunk.offset / ELEMENT_PER_VERTEX)
      }
   }
}
