// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
export type TypedArray =
   | Int8Array
   | Uint8Array
   | Uint8ClampedArray
   | Int16Array
   | Uint16Array
   | Int32Array
   | Uint32Array
   | Float32Array
   | Float64Array

export class BlokiGPU {
   static async aquireGPU(adapterOptions?: GPURequestAdapterOptions, deviceDescriptor?: GPUDeviceDescriptor) {
      const { gpu } = navigator
      if (!gpu) throw new Error('WebGPU is not supported on this browser.')
      const adapter = await gpu.requestAdapter(adapterOptions)
      if (!adapter) throw new Error('WebGPU supported but disabled')
      const device = await adapter.requestDevice(deviceDescriptor)
      console.log(device.limits)
      return { adapter, device }
   }
   static getTypedArrayAlignedSize(arr: TypedArray) {
      return (arr.byteLength + 3) & ~3
   }
   static createBufferFromArray(
      device: GPUDevice,
      arr: TypedArray,
      usage: number,
      size = BlokiGPU.getTypedArrayAlignedSize(arr)
   ) {
      const buffer = device.createBuffer({
         size,
         usage,
         mappedAtCreation: true,
      })
      const TypedArrayCtor = Object.getPrototypeOf(arr).constructor
      const mappedRange = new TypedArrayCtor(buffer.getMappedRange())
      mappedRange.set(arr)
      buffer.unmap()
      return buffer
   }

   static async compileShader(device: GPUDevice, code: string) {
      const shaderModule = device.createShaderModule({ code })
      const shaderCompileInfo = await shaderModule.compilationInfo()
      if (shaderCompileInfo.messages.length > 0) {
         let hadError = false
         for (const msg of shaderCompileInfo.messages) {
            console.error(`${msg.lineNum}:${msg.linePos} - ${msg.message}`)
            if (msg.type == 'error') hadError = true
         }
         if (hadError) throw new Error('Shader failed to compile')
      }
      return shaderModule
   }
}
