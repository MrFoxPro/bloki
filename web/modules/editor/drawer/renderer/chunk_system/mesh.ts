import {
   ELEMENT_PER_VERTEX,
   IBO_ARRAY,
   IBO_CHUNK_SIZE,
   INDEX_FORMAT,
   VBO_ARRAY,
   VBO_CHUNK_SIZE,
} from '../constants'
import { IMesh, TypedArray } from '../types'
import { GPUBufferChunk, GPUBufferManager } from './gpu'

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
      this.group?.writeMesh(this, { verts: this._verts })
      this._verts = verts
   }
   get indices() {
      return this._indices
   }
   set indices(indices) {
      this.group?.writeMesh(this, { indices: this._indices })
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

/**
 * Smart entity
 */
export class MeshGroup {
   vbo: GPUBufferManager
   ibo: GPUBufferManager
   readonly objects = new Set<Mesh>()
   constructor(device: GPUDevice) {
      this.vbo = new GPUBufferManager(device, new VBO_ARRAY(), GPUBufferUsage.VERTEX)
      this.ibo = new GPUBufferManager(device, new IBO_ARRAY(), GPUBufferUsage.INDEX)
   }
   addMesh(mesh: Mesh) {
      const vChunk = this.vbo.createChunk(mesh.verts)
      const iChunk = this.ibo.createChunk(mesh.indices)
      this.vbo.respawn()
      this.ibo.respawn()
      this.attachMesh(mesh, vChunk, iChunk)
      this.objects.add(mesh)
   }
   removeMesh(mesh: Mesh) {
      if (this.objects.delete(mesh)) {
         mesh.vChunk.remove()
         mesh.iChunk.remove()
         mesh = null
      }
   }
   attachMesh(mesh: Mesh, vChunk: GPUBufferChunk, iChunk: GPUBufferChunk) {
      mesh.group = this
      mesh.vChunk = vChunk
      mesh.iChunk = iChunk
   }
   writeMesh(mesh: Mesh, { verts, indices }: Partial<IMesh>) {
      if (verts) {
         this.editChunk(mesh, mesh.vChunk, new VBO_ARRAY(verts))
      }
      if (indices) {
         this.editChunk(mesh, mesh.iChunk, new IBO_ARRAY(indices))
      }
   }
   protected editChunk(mesh: Mesh, chunk: GPUBufferChunk, data: TypedArray) {
      chunk.write(data)
   }
   public setRenderCommands(pass: GPURenderPassEncoder) {
      // pass.setVertexBuffer(0, this.vbo.buffer)
      // pass.setIndexBuffer(this.ibo.buffer, INDEX_FORMAT)
      // pass.drawIndexed(this.ibo.array.length)
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
   get isEmpty() {
      return this.ibo.array.length === 0
   }
   public toString() {
      return `MeshManager. IBO: ${this.ibo.toString()} \n VBO: ${this.vbo.toString()}`
   }
   dispose() {
      this.vbo?.dispose()
      this.ibo?.dispose()
   }
}

export class DynamicMeshGroup extends MeshGroup {
   override addMesh(mesh: Mesh) {
      const vChunk = this.vbo.createChunk(mesh.verts, VBO_CHUNK_SIZE)
      const iChunk = this.ibo.createChunk(mesh.indices, IBO_CHUNK_SIZE)
      this.vbo.respawn()
      this.ibo.respawn()
      this.attachMesh(mesh, vChunk, iChunk)
      this.objects.add(mesh)
   }
   protected override editChunk(mesh: Mesh, chunk: GPUBufferChunk, data: TypedArray) {
      if (data.length > chunk.length) {
         chunk.resize(chunk.length + chunk.allocLength)
      }
      chunk.manager.respawn()
      super.editChunk(mesh, chunk, data)
   }
   override setRenderCommands(pass: GPURenderPassEncoder) {
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
