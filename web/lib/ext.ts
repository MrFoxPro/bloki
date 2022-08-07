export function registerExtensions() {
   Object.defineProperty(Number.prototype, 'px', {
      get: function () {
         return this + 'px'
      },
   })
}
