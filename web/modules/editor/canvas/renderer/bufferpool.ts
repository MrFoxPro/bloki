import { TypedArray, TypedArrayConstructor } from './utils'

export class GPUBufferPool {
   array: TypedArray
   buffer: GPUBuffer
   readonly purpose: GPUFlagsConstant
   readonly device: GPUDevice
   readonly chunks = new Set<GPUBufferChunk>()
   readonly ArrayConstructor: TypedArrayConstructor
   constructor(device: GPUDevice, arr: TypedArray, purpose: GPUFlagsConstant) {
      this.device = device
      this.array = arr
      this.purpose = purpose
      this.ArrayConstructor = arr.constructor as TypedArrayConstructor
      this.respawn()
   }
   createChunk(data: ArrayLike<number>, alloc_length: number = data.length) {
      const offset = this.array.length
      if (data.length > alloc_length) {
         // console.warn('alloc_length not fit for data')
         alloc_length = data.length
      }
      const new_array = new this.ArrayConstructor(offset + alloc_length)
      new_array.set(this.array)
      new_array.set(data, offset)
      this.array = new_array
      const chunk = new GPUBufferChunk(this, offset, data.length, alloc_length)
      this.chunks.add(chunk)
      this.respawn()
      return chunk
   }
   readChunk(chunk: GPUBufferChunk, onlyData = false) {
      const start = chunk.offset
      const len = onlyData ? chunk.dataLength : chunk.length
      return this.array.slice(start, start + len)
   }
   writeChunk(chunk: GPUBufferChunk, arr: ArrayLike<number>) {
      const data = new this.ArrayConstructor(arr)
      this.array.set(data, chunk.offset)
      this.device.queue.writeBuffer(this.buffer, chunk.offset * this.array.BYTES_PER_ELEMENT, data)
      chunk.dataLength = data.length
   }
   resizeChunk(chunk: GPUBufferChunk, length: number, displacedData: ArrayLike<number> = []) {
      const dLen = length - chunk.length
      const new_array = new this.ArrayConstructor(this.array.length + dLen)
      new_array.set(this.array.slice(0, chunk.offset))
      new_array.set(this.array.slice(chunk.end, this.array.length), chunk.end + dLen)

      chunk.length = length

      new_array.set(displacedData ?? chunk.read(true), chunk.offset)
      this.array = new_array
      let prev: GPUBufferChunk = null
      for (const chunk of this.chunks) {
         if (!prev) {
            chunk.offset = 0
            prev = chunk
            continue
         }
         chunk.offset = prev.offset + prev.length
         prev = chunk
      }
      this.respawn()
   }
   removeChunk(chunk: GPUBufferChunk) {
      this.resizeChunk(chunk, 0)
      this.chunks.delete(chunk)
   }
   respawn() {
      this.buffer?.destroy()
      const buffer = this.device.createBuffer({
         size: this.array.byteLength,
         usage: this.purpose | GPUBufferUsage.COPY_DST,
         mappedAtCreation: true,
      })
      const mappedRange = Reflect.construct(this.ArrayConstructor, [buffer.getMappedRange()])
      mappedRange.set(this.array)
      this.buffer = buffer
      buffer.unmap()
   }
}

export class GPUBufferChunk {
   manager: GPUBufferPool
   offset: number
   length: number
   dataLength: number
   readonly allocLength: number
   constructor(manager: GPUBufferPool, offset: number, dataLength: number, allocLength: number) {
      this.manager = manager
      this.offset = offset
      this.dataLength = dataLength
      this.length = allocLength
      this.allocLength = allocLength
   }
   get remaining() {
      return this.length - this.dataLength
   }
   get end() {
      return this.offset + this.length
   }
   read(onlyData = false) {
      return this.manager.readChunk(this, onlyData)
   }
   write(data: ArrayLike<number>) {
      return this.manager.writeChunk(this, data)
   }
   resize(length: number, newChunkValue?: ArrayLike<number>) {
      return this.manager.resizeChunk(this, length, newChunkValue)
   }
   remove() {
      return this.manager.removeChunk(this)
   }
}
