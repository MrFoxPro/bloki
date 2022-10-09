import { Pool } from './buffer/pool'
import { SingleColorMesh2D } from './mesh/2d/single_color_mesh2d'
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
   clrbo: Pool
   readonly objects = new Set<SingleColorMesh2D>()
   constructor(device: GPUDevice) {
      this.vbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new Pool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
      this.clrbo = new Pool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
   }
   protected abstract initChunks(mesh: SingleColorMesh2D): void
   protected abstract draw(pass: GPURenderPassEncoder): void
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
      if (!this.shouldRender) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setVertexBuffer(1, this.clrbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      this.draw(pass)
   }
   public get shouldRender() {
      return this.objects.size > 0
   }
}

export class TightIndexedMeshGroup extends IndexedMeshGroupBase {
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
      pass.drawIndexed(this.ibo.array.length, 1)
   }
}

export class PiecewiseIndexedMeshGroup extends IndexedMeshGroupBase {
   protected override initChunks(mesh: SingleColorMesh2D) {
      mesh.vChunk = this.vbo.create(mesh.layout.vbo)
      mesh.iChunk = this.ibo.create(mesh.layout.ibo)
      mesh.clrChunk = this.clrbo.create(mesh.layout.clrbo)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      for (const mesh of this.objects) {
         pass.drawIndexed(mesh.iChunk.size, 1, mesh.iChunk.offset, mesh.vChunk.offset / ELEMENT_PER_VERTEX)
      }
   }
}
