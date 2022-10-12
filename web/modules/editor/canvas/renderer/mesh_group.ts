import { Pool } from './buffer/pool'
import { IndexedMeshBase, Mesh2D, SingleColorMesh2D } from './mesh/mesh'
import { VBO_ARRAY, IBO_ARRAY, INDEX_FORMAT, ELEMENT_PER_VERTEX } from './utils'

export abstract class MeshGroup<T extends Mesh2D = Mesh2D> {
   readonly objects = new Set<T>()
   abstract recordRenderPass(pass: GPURenderPassEncoder): void
   abstract add(mesh: T): void
   abstract remove(mesh: T): T
}

export class IndexedMeshGroup extends MeshGroup<IndexedMeshBase> {
   vbo: Pool
   ibo: Pool
   constructor(device: GPUDevice) {
      super()
      this.vbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new Pool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   protected initChunks(mesh: IndexedMeshBase) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
   }
   protected draw(pass: GPURenderPassEncoder) {
      for (const mesh of this.objects) {
         pass.drawIndexed(mesh.iChunk.size, 1, mesh.iChunk.offset, mesh.vChunk.offset / ELEMENT_PER_VERTEX)
      }
   }
   add(mesh: IndexedMeshBase) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   remove(mesh: IndexedMeshBase) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.vChunk = null
         mesh.iChunk.remove()
         mesh.vChunk = null
         return mesh
      }
   }
   recordRenderPass(pass: GPURenderPassEncoder) {
      if (!this.objects.size) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      this.draw(pass)
   }
}

export class BatchedIndexedMeshGroup extends IndexedMeshGroup {
   protected override initChunks(mesh: SingleColorMesh2D) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      this.align_ibo(mesh)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
   }
   private align_ibo(mesh: SingleColorMesh2D) {
      const baseVert = mesh.vChunk.offset / ELEMENT_PER_VERTEX
      mesh.layout.ibo = mesh.indices.map((index) => baseVert + index)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      pass.drawIndexed(this.ibo.array.length, 1)
   }
}
