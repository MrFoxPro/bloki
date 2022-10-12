import { TypedArray, TypedArrayConstructor } from '../utils'
import { Chunk } from './chunk'

export class BufferPool {
   buffer: GPUBuffer
   readonly chunks = new Set<Chunk>()
   readonly ArrayConstructor: TypedArrayConstructor
   constructor(readonly device: GPUDevice, public array: TypedArray, readonly purpose: GPUFlagsConstant) {
      this.ArrayConstructor = array.constructor as TypedArrayConstructor
      this.respawn()
   }
   protected resize(chunk: Chunk, modified: number[], dLen: number) {
      // here set length the same or increase to pieceSize
      const new_array = new this.ArrayConstructor(this.array.length + dLen)
      new_array.set(this.array.slice(0, chunk.offset))
      new_array.set(this.array.slice(chunk.end, this.array.length), chunk.end + dLen)
      chunk.size = modified.length
      new_array.set(modified, chunk.offset)
      this.array = new_array
   }
   protected resetOffsets() {
      let prev: Chunk = null
      for (const chunk of this.chunks) {
         if (!prev) {
            chunk.offset = 0
            prev = chunk
            continue
         }
         chunk.offset = prev.offset + prev.size
         prev = chunk
      }
   }
   protected respawn() {
      this.buffer?.destroy()
      const buffer = this.device.createBuffer({
         size: this.array.byteLength,
         usage: this.purpose | GPUBufferUsage.COPY_DST,
         mappedAtCreation: true,
      })
      const mappedRange = new this.ArrayConstructor(buffer.getMappedRange())
      mappedRange.set(this.array)
      this.buffer = buffer
      buffer.unmap()
   }
   create(data: ArrayLike<number>) {
      const offset = this.array.length
      const new_array = new this.ArrayConstructor(offset + data.length)
      new_array.set(this.array)
      new_array.set(data, offset)
      this.array = new_array
      const chunk = new Chunk(this, offset, data.length)
      this.chunks.add(chunk)
      this.respawn()
      return chunk
   }
   slice(chunk: Chunk, localStart: number = 0, localEnd: number = chunk.size) {
      return this.array.slice(chunk.offset + localStart, chunk.offset + localEnd)
   }
   set(chunk: Chunk, _data: ArrayLike<number>, lOffset: number = 0) {
      const data = _data instanceof this.ArrayConstructor ? _data : new this.ArrayConstructor(_data)
      const gOffset = chunk.offset + lOffset
      this.array.set(data, gOffset)
      this.device.queue.writeBuffer(this.buffer, lOffset * this.array.BYTES_PER_ELEMENT, data)
   }
   splice(chunk: Chunk, start: number, deleteCount: number, ...items: number[]) {
      const modified = Array.from(chunk.slice())
      const deleted = modified.splice(start, deleteCount, ...items)
      const dLen = modified.length - chunk.size
      if (dLen === 0) {
         // just rewrite existing data
         chunk.set(modified, start)
         return deleted
      }
      this.resize(chunk, modified, dLen)
      this.resetOffsets()
      this.respawn()
      return deleted
   }
   remove(chunk: Chunk) {
      this.splice(chunk, 0, chunk.size)
      return this.chunks.delete(chunk)
   }
}

// export class BlockedPool extends Pool {
//    readonly chunks = new Set<BlockedChunk>()
//    constructor(device: GPUDevice, array: TypedArray, purpose: number, readonly block_size: number) {
//       super(device, array, purpose)
//    }
//    override splice(chunk: Chunk, start: number, deleteCount: number, ...items: number[]): number[] {}
// }
