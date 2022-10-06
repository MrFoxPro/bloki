import { GPUBufferChunk, GPUBufferPool } from './bufferpool'
import {
   ELEMENT_PER_VERTEX,
   IBO_ARRAY,
   IBO_CHUNK_LENGTH,
   INDEX_FORMAT,
   TypedArray,
   VBO_ARRAY,
   VBO_CHUNK_LENGTH,
} from './utils'

export abstract class MeshBase {
   vChunk: GPUBufferChunk | null
   iChunk: GPUBufferChunk | null
   group: MeshGroupBase | null
   protected _verts: readonly number[] = []
   protected _indices: readonly number[] = []
   constructor()
   constructor(verts: readonly number[], indices: readonly number[])
   constructor(verts: number[] = [], indices: number[] = []) {
      this._verts = verts
      this._indices = indices
   }
   get verts() {
      return this._verts
   }
   set verts(verts) {
      if (this.attached) this.group?.updateMeshChunk(this.vChunk, verts)
      // this.iChunk?.write(this.vChunk, verts)
      this._verts = verts
   }
   get indices() {
      return this._indices
   }
   set indices(indices) {
      if (this.attached) this.group?.updateMeshChunk(this.iChunk, indices)
      // this.iChunk?.write(indices)
      this._indices = indices
   }
   get attached() {
      return this.group && this.vChunk && this.iChunk
   }
   remove() {
      return this.group?.removeMesh(this)
   }
   buildMesh() {}
}

export abstract class MeshGroupBase {
   vbo: GPUBufferPool
   ibo: GPUBufferPool
   readonly objects = new Set<MeshBase>()
   constructor(device: GPUDevice) {
      this.vbo = new GPUBufferPool(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new GPUBufferPool(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   protected initChunks(mesh: MeshBase) {
      mesh.vChunk = this.vbo.createChunk(mesh.verts)
      mesh.iChunk = this.ibo.createChunk(mesh.indices)
   }

   protected abstract draw(pass: GPURenderPassEncoder): void

   public abstract updateMeshChunk(chunk: GPUBufferChunk, data: ArrayLike<number>): void
   public addMesh(mesh: MeshBase) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   public removeMesh(mesh: MeshBase) {
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
   public writeStatic(chunk: GPUBufferChunk, data: ArrayLike<number>) {
      chunk.write(data)
   }
   public writeDynamic(chunk: GPUBufferChunk, data: TypedArray) {
      if (data.length > chunk.length) {
         chunk.resize(chunk.length + chunk.allocLength, data)
      } else chunk.write(data)
   }
   public get shouldRender() {
      return this.objects.size > 0
   }
}

export class StaticMeshGroup extends MeshGroupBase {
   protected override initChunks(mesh: MeshBase) {
      const baseVert = this.vbo.array.length / ELEMENT_PER_VERTEX
      mesh.vChunk = this.vbo.createChunk(mesh.verts)
      const alignedIndices = mesh.indices.map((index) => baseVert + index)
      mesh.iChunk = this.ibo.createChunk(alignedIndices)
   }
   public override updateMeshChunk(chunk: GPUBufferChunk, data: ArrayLike<number>) {
      this.writeStatic(chunk, data)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      pass.drawIndexed(this.ibo.array.length, 1)
   }
}

export class DynamicMeshGroup extends MeshGroupBase {
   protected override initChunks(mesh: MeshBase) {
      mesh.vChunk = this.vbo.createChunk(mesh.verts, VBO_CHUNK_LENGTH)
      mesh.iChunk = this.ibo.createChunk(mesh.indices, IBO_CHUNK_LENGTH)
   }
   public override updateMeshChunk(chunk: GPUBufferChunk, data: TypedArray) {
      this.writeDynamic(chunk, data)
   }
   protected override draw(pass: GPURenderPassEncoder) {
      for (const mesh of this.objects) {
         pass.drawIndexed(
            mesh.iChunk.dataLength,
            1,
            mesh.iChunk.offset,
            mesh.vChunk.offset / ELEMENT_PER_VERTEX
         )
      }
   }
}
