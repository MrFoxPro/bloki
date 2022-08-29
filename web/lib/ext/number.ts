declare global {
   interface Number {
      px: string
   }
}

Object.defineProperty(Number.prototype, 'px', {
   get: function () {
      return this + 'px'
   },
})
export {}
