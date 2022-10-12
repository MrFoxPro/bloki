import { BufferPool } from './buffer/pool'
import { Mesh2D } from './mesh'
import { FatLine2D } from './objects/line/line2d'
import { VBO_ARRAY, IBO_ARRAY, INDEX_FORMAT, ELEMENT_PER_VERTEX } from './utils'

export interface MeshGroup<T extends Mesh2D = Mesh2D> {
   readonly objects: Set<T>
   addMesh(mesh: T): void
   removeMesh(mesh: T): T
   recordRender(pass: GPURenderPassEncoder | GPURenderBundleEncoder): void
}

export class IndexedMeshGroup implements MeshGroup<FatLine2D> {
   vbo: BufferPool
   ibo: BufferPool
   objects = new Set<FatLine2D>()
   constructor(device: GPUDevice) {
      this.vbo = new BufferPool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new BufferPool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   initChunks(mesh: FatLine2D) {
      mesh.vChunk = this.vbo.create(mesh.vertices)
      mesh.iChunk = this.ibo.create(mesh.indices)
   }
   addMesh(mesh: FatLine2D) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   removeMesh(mesh: FatLine2D) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.vChunk = null
         mesh.iChunk.remove()
         mesh.vChunk = null
         return mesh
      }
   }
   recordRender(pass: GPURenderPassEncoder | GPURenderBundleEncoder) {
      if (!this.objects.size) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      const isBundle = pass instanceof GPURenderBundleEncoder
      for (const mesh of this.objects) {
         pass.drawIndexed(mesh.iChunk.size, 1, mesh.iChunk.offset, mesh.vChunk.offset / ELEMENT_PER_VERTEX)
      }
   }
}

// export class BatchedIndexedMeshGroup extends IndexedMeshGroup {
//    protected override initChunks(mesh: SingleColorStroke2D) {
//       this.align_ibo(mesh)
//       super.initChunks(mesh)
//    }
//    private align_ibo(mesh: SingleColorStroke2D) {
//       const baseVert = mesh.vChunk.offset / ELEMENT_PER_VERTEX
//       mesh.layout.ibo = mesh.indices.map((index) => baseVert + index)
//    }
//    protected override drawPass(pass: GPURenderPassEncoder) {
//       pass.drawIndexed(this.ibo.array.length, 10)
//    }
// }
