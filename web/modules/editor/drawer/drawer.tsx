import './drawer.scss'
import { createComputed, createEffect, For, onCleanup, onMount } from 'solid-js'
import { isInsideRect, ToolType } from '../misc'

import { toBlobAsync } from './helpers'
import { Transform, Point } from '../types'
import { useEditorContext } from '../toolbox/editor.store'
import * as twgl from 'twgl.js'

type Figure = {
   bound: Transform
   points: Point[]
}

import triangleShader from './triangle.wgsl?raw'
import { buildNonNativeLine } from './line'
import { WebGPUSeed } from './test2'
import { createStore } from 'solid-js/store'
import { Repeat } from '@solid-primitives/range'

export async function ensureShaderCompiled(shaderModule: GPUShaderModule) {
   const shaderCompileInfo = await shaderModule.compilationInfo()

   if (shaderCompileInfo.messages.length > 0) {
      let hadError = false
      for (const msg of shaderCompileInfo.messages) {
         console.log(`${msg.lineNum}:${msg.linePos} - ${msg.message}`)
         if (msg.type == 'error') hadError = true
      }
      if (hadError) throw new Error('Shader failed to compile')
   }
}

export function Drawer(props: DrawerProps) {
   let canvasRef: HTMLCanvasElement
   const [store, setStore] = createStore({
      v0: {
         pos: { x: -1, y: 0, z: 0, w: 1 },
         color: { r: 1, g: 0, b: 0, a: 1 },
      },
      v1: {
         pos: { x: 1, y: 0, z: 0, w: 1 },
         color: { r: 0, g: 1, b: 0, a: 1 },
      },
      v2: {
         pos: { x: 0, y: 0.5, z: 0, w: 1 },
         color: { r: 0, g: 0, b: 1, a: 1 },
      },
   })

   const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]
   let vBuffer: GPUBuffer
   let viewPortBuffer: GPUBuffer
   let uniformBindGroup: GPUBindGroup
   let device: GPUDevice
   let passEncoder: GPURenderPassEncoder
   let renderPipeline: GPURenderPipeline
   let commandEncoder: GPUCommandEncoder
   let ctx: GPUCanvasContext

   const viewPort = [100, 100, 100]

   async function initRenderer() {
      const { gpu } = navigator
      if (!gpu) throw new Error('WebGPU is not supported on this browser.')

      const adapter = await gpu.requestAdapter()

      if (!adapter) throw new Error('WebGPU supported but disabled')

      device = await adapter.requestDevice()

      ctx = canvasRef.getContext('webgpu')

      let textureFormat: GPUTextureFormat
      if (gpu.getPreferredCanvasFormat) textureFormat = gpu.getPreferredCanvasFormat()
      // @ts-ignore FF
      else textureFormat = ctx.getPreferredFormat(adapter)
      // console.log('Preffered format for device', device, 'is', textureFormat)

      ctx.configure({
         device,
         format: textureFormat,
         usage: GPUTextureUsage.RENDER_ATTACHMENT,
         alphaMode: 'opaque',
      })

      const shaderModule = device.createShaderModule({ code: triangleShader })
      await ensureShaderCompiled(shaderModule)

      // Create buffer in GPU
      // We are setting position and color via vec4<f32> in shader
      // sizeof(f32) is 32bit => 4 bytes
      // Since we are doing triangle, we need pass 2 vec4<f32> attributes for three vertices:
      // [pos1, color1], [pos2, color2], [pos3, color3]
      // So we need buffer of size 3(vertices) * 2(attributes) * (4 * 4)(sizeof vec4<f32>) = 96 bytes!
      vBuffer = device.createBuffer({
         size: 3 * 2 * 4 * 4,
         usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
         mappedAtCreation: true,
      })
      // Map buffer to CPU and
      // Set mapped buffer values
      // Interleaved positions and colors
      // 96 bytes total!
      new Float32Array(vBuffer.getMappedRange()).set(dataToBuffer())
      // Give control over the buffer to GPU again
      vBuffer.unmap()

      viewPortBuffer = device.createBuffer({
         size: 4 * 4, //(sizeof vec4<f32>)
         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
         mappedAtCreation: true,
      })
      new Float32Array(viewPortBuffer.getMappedRange()).set(viewPort)

      const viewProjBindGroupLayout = device.createBindGroupLayout({
         entries: [
            {
               binding: 0,
               visibility: GPUShaderStage.VERTEX,
               buffer: {
                  type: 'uniform',
                  hasDynamicOffset: false,
                  minBindingSize: null,
               },
            },
         ],
      })
      uniformBindGroup = device.createBindGroup({
         layout: viewProjBindGroupLayout,
         entries: [
            {
               binding: 0,
               resource: {
                  buffer: viewPortBuffer,
                  offset: 0,
                  size: viewPortBuffer.size,
               },
            },
         ],
      })
      renderPipeline = await device.createRenderPipelineAsync({
         // layout: 'auto',
         // layout: device.createPipelineLayout({
         //    bindGroupLayouts: []
         // }),
         layout: device.createPipelineLayout({
            bindGroupLayouts: [viewProjBindGroupLayout],
         }),
         primitive: {
            topology: 'triangle-strip',
         },
         vertex: {
            module: shaderModule,
            entryPoint: 'vertex',
            buffers: [
               {
                  // float32 is 4 bytes
                  // float32x4 is 4 numbers for 4 bytes = 4 * 4
                  // we have 2 atributes, so arrayStride will be sum of all offsets: 4 * 4 + 4 * 4 = 2 * 4 * 4
                  arrayStride: 2 * 4 * 4,
                  attributes: [
                     { format: 'float32x4', offset: 0, shaderLocation: 0 },
                     { format: 'float32x4', offset: 4 * 4, shaderLocation: 1 },
                  ],
               },
            ],
         },
         fragment: {
            module: shaderModule,
            entryPoint: 'fragment',
            targets: [{ format: textureFormat }],
         },
      })
      frame()
   }

   const dataToBuffer = () => {
      const arr = []
      for (const vertId in store) {
         const vert = store[vertId]

         arr.push(vert.pos.x, vert.pos.y, vert.pos.z, vert.pos.w)
         arr.push(vert.color.r, vert.color.g, vert.color.b, vert.color.a)
      }
      return arr
   }

   function frame() {
      commandEncoder = device.createCommandEncoder()
      passEncoder = commandEncoder.beginRenderPass({
         colorAttachments: [
            {
               view: ctx.getCurrentTexture().createView(),
               loadOp: 'clear',
               clearValue,
               storeOp: 'store',
               // @ts-ignore FF
               loadValue: clearValue,
            },
         ],
      })
      passEncoder.setPipeline(renderPipeline)
      passEncoder.setBindGroup(0, uniformBindGroup)

      passEncoder.setVertexBuffer(0, vBuffer)
      passEncoder.draw(3, 1, 0, 0)

      if ('end' in passEncoder) passEncoder.end()
      // @ts-ignore FF
      else passEncoder.endPass()
      device.queue.submit([commandEncoder.finish()])
   }

   createEffect(async () => {
      const buffer = dataToBuffer()
      if (!vBuffer) return
      device.queue.writeBuffer(vBuffer, 0, new Float32Array(buffer))
      frame()
   })

   onMount(initRenderer)

   const data = {
      shape: {},
      points: [
         // p1
         0, 0,
         // p2
         5, 5,
         // p3
         5, 10,
         // p4
         10, 20,
      ],
      lineStyle: {
         width: 2,
         miterLimit: 1,
         alignment: 0.5,
      },
   }
   const geometry = {
      closePointEps: 1e-4,
      points: [],
      indices: [],
   }
   buildNonNativeLine(data, geometry)

   console.log('points', geometry.points, 'indices', geometry.indices)

   return (
      <div>
         <div
            style={{
               width: '200px',
            }}
         ></div>
         <canvas
            // onPointerDown={onPointerDown}
            // onPointerMove={onDraw}
            // onPointerUp={onDrawEnd}
            // onPointerLeave={onDrawEnd}
            // classList={{
            //    ontop: editor.tool !== ToolType.Cursor,
            // }}
            ref={canvasRef}
            style={{
               'margin-left': '5px',
            }}
            width="350px"
            height="350px"
            // width={toAbs(editor.doc.gridOptions.width).px}
            // height={toAbs(editor.doc.gridOptions.height).px}
         />
      </div>
   )
}
