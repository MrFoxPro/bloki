import { Point2DTupleView } from '../../types'
import { TypedArray } from './types'

// export function getTypedArrayAlignedSize(arr: TypedArray) {
//    return (arr.byteLength + 3) & ~3
// }

export function createBufferFromArray(device: GPUDevice, arr: TypedArray, usage: number, size?: number) {
   // if (!size) size = getTypedArrayAlignedSize(arr)
   if (!size) size = arr.byteLength
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

export async function aquireGPUDevice(
   adapterOptions?: GPURequestAdapterOptions,
   descriptor?: GPUDeviceDescriptor
) {
   const { gpu } = navigator
   if (!gpu) throw new Error('WebGPU is not supported on this browser.')
   const adapter = await gpu.requestAdapter(adapterOptions)
   if (!adapter) throw new Error('WebGPU supported but disabled')
   const device = await adapter.requestDevice(descriptor)
   return { device, adapter }
}

export async function compileShader(device: GPUDevice, code: string) {
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

export function convertCoords(canvas: HTMLCanvasElement, p: Point2DTupleView) {
   p[0] = p[0] - canvas.width / 2
   p[1] = -p[1] + canvas.height / 2
   return p
}
