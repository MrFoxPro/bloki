// declare global {
//    interface Number {
//       px: string
//    }
// }

// Object.defineProperty(Number.prototype, 'px', {
//    get: function () {
//       return this + 'px'
//    },
// })
function px(n) {
   return n + 'px'
}
const value = 5

const result = px(value)

export {}
