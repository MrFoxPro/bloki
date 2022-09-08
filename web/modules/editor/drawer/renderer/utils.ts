import { buildNonNativeLine, LINE_CAP, LINE_JOIN, SHAPES } from '../line'
import { LineStyle, Mesh, TypedArray } from './types'

export function getTypedArrayAlignedSize(arr: TypedArray) {
   return (arr.byteLength + 3) & ~3
}

export function createBufferFromArray(device: GPUDevice, arr: TypedArray, usage: number, size?: number) {
   if (!size) size = getTypedArrayAlignedSize(arr)
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

export async function aquireGPU(adapterOptions?: GPURequestAdapterOptions, descriptor?: GPUDeviceDescriptor) {
   const { gpu } = navigator
   if (!gpu) throw new Error('WebGPU is not supported on this browser.')
   const adapter = await gpu.requestAdapter(adapterOptions)
   if (!adapter) throw new Error('WebGPU supported but disabled')
   const device = await adapter.requestDevice(descriptor)
   return { gpu, adapter, device }
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

export const defaultLineStyle: LineStyle = {
   width: 3,
   miterLimit: 0.01,
   alignment: 0.01,
   cap: LINE_CAP.SQUARE,
   join: LINE_JOIN.BEVEL,
   color: [0.5, 1, 0.5, 1],
}

export function computeLineMesh(points: number[], lineStyle = defaultLineStyle) {
   const geometry = {
      closePointEps: 1e-4,
      verts: [] as number[],
      indices: [] as number[],
      lineStyle,
   }
   buildNonNativeLine(
      {
         shape: {
            closeStroke: false,
            type: SHAPES.POLY,
         },
         points,
         lineStyle,
      },
      geometry
   )
   const mesh: Mesh = {
      verts: geometry.verts,
      indices: geometry.indices,
   }
   return mesh
}
