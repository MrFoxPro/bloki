import { Pool } from './pool'

export class Chunk {
   manager: Pool
   offset: number
   length: number
   constructor(manager: Pool, offset: number, length: number) {
      this.manager = manager
      this.offset = offset
      this.length = length
   }
   get end() {
      return this.offset + this.length
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
