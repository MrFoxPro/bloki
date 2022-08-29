// https://bugzilla.mozilla.org/show_bug.cgi?id=1785576
GPURenderPassEncoder.prototype.end = function (this: GPURenderPassEncoder) {
   if ('endPass' in this) return this.endPass()
   return this.end()
}
export {}
