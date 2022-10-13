import { BufferPool } from './pool'
import { Mesh2D } from './mesh'
import { FatLine2D } from './objects/line/line2d'
import { VBO_ARRAY, IBO_ARRAY, INDEX_FORMAT, ELEMENT_PER_VERTEX, UBO_ARRAY } from './utils'
import { Renderer } from './output'

export interface MeshGroup<T extends Mesh2D = Mesh2D> {
   readonly objects: Set<T>
   addMesh(mesh: T): void
   removeMesh(mesh: T): T
   recordRender(pass: GPURenderPassEncoder | GPURenderBundleEncoder): void
}

const floatsInUBOAlignment = 256 / Float32Array.BYTES_PER_ELEMENT
export class IndexedMeshGroup implements MeshGroup<FatLine2D> {
   vbo: BufferPool
   ibo: BufferPool
   ubo: BufferPool
   objects = new Set<FatLine2D>()
   constructor(readonly renderer: Renderer) {
      this.vbo = new BufferPool(renderer.device, new VBO_ARRAY(), GPUBufferUsage.VERTEX, 'vbo')
      this.ibo = new BufferPool(renderer.device, new IBO_ARRAY(), GPUBufferUsage.INDEX, 'ibo')
      this.ubo = new BufferPool(renderer.device, new UBO_ARRAY(), GPUBufferUsage.UNIFORM, 'ubo')
   }
   initChunks(mesh: FatLine2D) {
      mesh.vChunk = this.vbo.create(mesh.vertices)
      mesh.iChunk = this.ibo.create(mesh.indices)
      mesh.clrChunk = this.ubo.create(mesh.color, floatsInUBOAlignment)
      this.setColorBindGroup(mesh)
   }
   setColorBindGroup(mesh: FatLine2D) {
      mesh.clrBindGroup = this.renderer.device.createBindGroup({
         label: 'color bind group',
         layout: this.renderer.pipeline.getBindGroupLayout(1),
         entries: [
            {
               binding: 0,
               resource: {
                  offset: mesh.clrChunk.offset * Float32Array.BYTES_PER_ELEMENT,
                  size: 4 * Float32Array.BYTES_PER_ELEMENT,
                  buffer: this.ubo.buffer,
               },
            },
         ],
      })
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
         mesh.clrChunk.remove()
         mesh.clrChunk = null
         return mesh
      }
   }
   recordRender(pass: GPURenderPassEncoder | GPURenderBundleEncoder) {
      if (!this.objects.size) return
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      const isBundle = pass instanceof GPURenderBundleEncoder
      for (const mesh of this.objects) {
         pass.setBindGroup(1, mesh.clrBindGroup)
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
