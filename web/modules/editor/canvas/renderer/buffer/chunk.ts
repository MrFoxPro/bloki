import { BufferPool } from './pool'

export class Chunk {
   constructor(readonly manager: BufferPool, public offset: number, public size: number) {}
   get end() {
      return this.offset + this.size
   }
   set(data: ArrayLike<number>, offset: number = 0) {
      return this.manager.set(this, data, offset)
   }
   slice(start?: number, end?: number) {
      return this.manager.slice(this, start, end)
   }
   splice(start: number, deleteCount: number, ...items: number[]) {
      return this.manager.splice(this, start, deleteCount, ...items)
   }
   remove() {
      return this.manager.remove(this)
   }
}
