import { Pool } from './buffer/pool'
import { SingleColorMesh2D } from './mesh/2d/single_color_mesh2d'
import { Mesh2D } from './mesh/mesh'
import { VBO_ARRAY, IBO_ARRAY, INDEX_FORMAT, ELEMENT_PER_VERTEX } from './utils'

export abstract class MeshGroup<T extends Mesh2D = Mesh2D> {
   readonly objects = new Set<T>()
   abstract recordRenderPass(pass: GPURenderPassEncoder): void
   abstract addMesh(mesh: T): void
   abstract removeMesh(mesh: T): T
}

export class IndexedMeshGroup extends MeshGroup<SingleColorMesh2D> {
   vbo: Pool
   ibo: Pool
   clrbo: Pool
   constructor(device: GPUDevice) {
      super()
      this.vbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new Pool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
      this.clrbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
   }
   protected initChunks(mesh: SingleColorMesh2D) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
      mesh.clrChunk = this.clrbo.create(mesh.layout.clrbo)
   }
   protected draw(pass: GPURenderPassEncoder) {
      const values = [...this.objects]
      for (let i = 0, n = values.length; i < n; i++) {
         const mesh = values[i]
         pass.drawIndexed(mesh.iChunk.size, 1, mesh.iChunk.offset, mesh.vChunk.offset / ELEMENT_PER_VERTEX, i)
      }
   }
   public addMesh(mesh: SingleColorMesh2D) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   public removeMesh(mesh: SingleColorMesh2D) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.vChunk = null
         mesh.iChunk.remove()
         mesh.vChunk = null
         mesh.clrChunk.remove()
         mesh.clrChunk = null
         return mesh
      }
   }
   public recordRenderPass(pass: GPURenderPassEncoder) {
      if (!this.objects.size) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setVertexBuffer(1, this.clrbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      this.draw(pass)
   }
}

export class BatchedIndexedMeshGroup extends IndexedMeshGroup {
   protected override initChunks(mesh: SingleColorMesh2D) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      this.align_ibo(mesh)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
      mesh.clrChunk = this.clrbo.create(mesh.layout.clrbo)
   }
   private align_ibo(mesh: SingleColorMesh2D) {
      const baseVert = mesh.vChunk.offset / ELEMENT_PER_VERTEX
      mesh.layout.ibo = mesh.indices.map((index) => baseVert + index)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      pass.drawIndexed(this.ibo.array.length, 10)
   }
}
