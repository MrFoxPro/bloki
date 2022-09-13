import {
   ELEMENT_PER_VERTEX,
   IBO_ARRAY,
   IBO_CHUNK_LENGTH,
   INDEX_FORMAT,
   VBO_ARRAY,
   VBO_CHUNK_LENGTH,
} from '../constants'
import { TypedArray } from '../types'
import { GPUBufferChunk, GPUBufferManager } from './gpu'

/**
 * Smart entity
 */
abstract class MeshGroup {
   vbo: GPUBufferManager
   ibo: GPUBufferManager
   protected readonly objects = new Set<Mesh>()
   constructor(device: GPUDevice) {
      this.vbo = new GPUBufferManager(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new GPUBufferManager(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   protected initChunks(mesh: Mesh) {
      mesh.vChunk = this.vbo.createChunk(mesh.verts)
      mesh.iChunk = this.ibo.createChunk(mesh.indices)
   }
   public addMesh(mesh: Mesh) {
      mesh.group = this
      this.initChunks(mesh)
      this.objects.add(mesh)
   }
   public removeMesh(mesh: Mesh) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.vChunk = null
         mesh.iChunk.remove()
         mesh.vChunk = null
         return mesh
      }
   }
   public abstract updateMeshChunk(chunk: GPUBufferChunk, data: ArrayLike<number>): void
   public abstract recordRenderPass(pass: GPURenderPassEncoder): void

   public writeStatic(chunk: GPUBufferChunk, data: ArrayLike<number>) {
      chunk.write(data)
   }
   public writeDynamic(chunk: GPUBufferChunk, data: TypedArray) {
      if (data.length > chunk.length) {
         chunk.resize(chunk.length + chunk.allocLength, data)
      } else chunk.write(data)
   }
}

export class StaticMeshGroup extends MeshGroup {
   protected override initChunks(mesh: Mesh) {
      const baseVert = this.vbo.array.length / ELEMENT_PER_VERTEX
      mesh.vChunk = this.vbo.createChunk(mesh.verts)

      const alignedIndices = mesh.indices.map((index) => baseVert + index)
      mesh.iChunk = this.ibo.createChunk(alignedIndices)
   }
   public override updateMeshChunk(chunk: GPUBufferChunk, data: ArrayLike<number>) {
      this.writeStatic(chunk, data)
   }
   public override recordRenderPass(pass: GPURenderPassEncoder) {
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      pass.drawIndexed(this.ibo.array.length, 1)
   }
}

export class DynamicMeshGroup extends MeshGroup {
   protected override initChunks(mesh: Mesh) {
      mesh.vChunk = this.vbo.createChunk(mesh.verts, VBO_CHUNK_LENGTH)
      mesh.iChunk = this.ibo.createChunk(mesh.indices, IBO_CHUNK_LENGTH)
   }
   public override updateMeshChunk(chunk: GPUBufferChunk, data: TypedArray) {
      this.writeDynamic(chunk, data)
   }
   public override recordRenderPass(pass: GPURenderPassEncoder) {
      pass.setVertexBuffer(0, this.vbo.buffer)
      pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
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

/**
 * Stupid public entity
 */
export class Mesh {
   vChunk: GPUBufferChunk | null
   iChunk: GPUBufferChunk | null
   group: MeshGroup | null
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
      this.group?.updateMeshChunk(this.vChunk, verts)
      this._verts = verts
   }
   get indices() {
      return this._indices
   }
   set indices(indices) {
      this.group?.updateMeshChunk(this.iChunk, indices)
      this._indices = indices
   }
   get attached() {
      return this.group && this.vChunk && this.iChunk
   }
   remove() {
      return this.group?.removeMesh(this)
   }
   clone() {
      return new Mesh(this._verts, this._indices)
   }
}
