import { onMount } from 'solid-js'
import { ensureShaderCompiled } from './drawer1'
import shaderCode from './seed.wgsl?raw'

// 📈 Position Vertex Buffer Data
const positions = new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0])
// 🎨 Color Vertex Buffer Data
const colors = new Float32Array([
   1.0,
   0.0,
   0.0, // 🔴
   0.0,
   1.0,
   0.0, // 🟢
   0.0,
   0.0,
   1.0, // 🔵
])

// 📇 Index Buffer Data
const indices = new Uint16Array([0, 1, 2])

export default class Renderer {
   canvas: HTMLCanvasElement

   // ⚙️ API Data Structures
   adapter: GPUAdapter
   device: GPUDevice
   queue: GPUQueue

   // 🎞️ Frame Backings
   context: GPUCanvasContext
   colorTexture: GPUTexture
   colorTextureView: GPUTextureView
   depthTexture: GPUTexture
   depthTextureView: GPUTextureView

   // 🔺 Resources
   positionBuffer: GPUBuffer
   colorBuffer: GPUBuffer
   indexBuffer: GPUBuffer
   shaderModule: GPUShaderModule
   pipeline: GPURenderPipeline

   commandEncoder: GPUCommandEncoder
   passEncoder: GPURenderPassEncoder

   constructor(canvas) {
      this.canvas = canvas
   }

   // 🏎️ Start the rendering engine
   async start() {
      if (await this.initializeAPI()) {
         this.resizeBackings()
         await this.initializeResources()
         this.render()
      }
   }

   // 🌟 Initialize WebGPU
   async initializeAPI(): Promise<boolean> {
      try {
         // 🏭 Entry to WebGPU
         const entry: GPU = navigator.gpu
         if (!entry) {
            return false
         }

         // 🔌 Physical Device Adapter
         this.adapter = await entry.requestAdapter()

         // 💻 Logical Device
         this.device = await this.adapter.requestDevice()

         // 📦 Queue
         this.queue = this.device.queue
      } catch (e) {
         console.error(e)
         return false
      }

      return true
   }

   // 🍱 Initialize resources to render triangle (buffers, shaders, pipeline)
   async initializeResources() {
      // 🔺 Buffers
      const createBuffer = (arr: Float32Array | Uint16Array, usage: number) => {
         // 📏 Align to 4 bytes (thanks @chrimsonite)
         let desc = {
            size: (arr.byteLength + 3) & ~3,
            usage,
            mappedAtCreation: true,
         }
         let buffer = this.device.createBuffer(desc)
         const writeArray =
            arr instanceof Uint16Array
               ? new Uint16Array(buffer.getMappedRange())
               : new Float32Array(buffer.getMappedRange())
         writeArray.set(arr)
         buffer.unmap()
         return buffer
      }

      this.positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX)
      this.colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX)
      this.indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX)

      this.shaderModule = this.device.createShaderModule({ code: shaderCode })
      // ⚗️ Graphics Pipeline
      await ensureShaderCompiled(this.shaderModule)
      // 🔣 Input Assembly
      const positionBufferDesc: GPUVertexBufferLayout = {
         attributes: [
            {
               shaderLocation: 0, // @location(0)
               offset: 0,
               format: 'float32x3',
            },
         ],
         arrayStride: 4 * 3, // sizeof(float) * 3
         stepMode: 'vertex',
      }
      const colorBufferDesc: GPUVertexBufferLayout = {
         attributes: [
            {
               shaderLocation: 1, // @location(1)
               offset: 0,
               format: 'float32x3',
            },
         ],
         arrayStride: 4 * 3, // sizeof(float) * 3
         stepMode: 'vertex',
      }

      // 🌑 Depth
      const depthStencil: GPUDepthStencilState = {
         depthWriteEnabled: true,
         depthCompare: 'less',
         format: 'depth24plus-stencil8',
      }

      // 🦄 Uniform Data
      const pipelineLayoutDesc = { bindGroupLayouts: [] }
      const layout = this.device.createPipelineLayout(pipelineLayoutDesc)

      // 🎭 Shader Stages
      const vertex: GPUVertexState = {
         module: this.shaderModule,
         entryPoint: 'v',
         buffers: [positionBufferDesc, colorBufferDesc],
      }

      // 🌀 Color/Blend State
      const colorState: GPUColorTargetState = {
         format: 'bgra8unorm',
         writeMask: 3,
      }

      const fragment: GPUFragmentState = {
         module: this.shaderModule,
         entryPoint: 'f',
         targets: [colorState],
      }

      // 🟨 Rasterization
      const primitive: GPUPrimitiveState = {
         frontFace: 'cw',
         cullMode: 'none',
         topology: 'triangle-list',
      }

      const pipelineDesc: GPURenderPipelineDescriptor = {
         layout,

         vertex,
         fragment,

         primitive,
         depthStencil,
      }
      this.pipeline = this.device.createRenderPipeline(pipelineDesc)
   }

   // ↙️ Resize swapchain, frame buffer attachments
   resizeBackings() {
      // ⛓️ Swapchain
      if (!this.context) {
         this.context = this.canvas.getContext('webgpu')
         const canvasConfig: GPUCanvasConfiguration = {
            device: this.device,
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            alphaMode: 'opaque',
         }
         this.context.configure(canvasConfig)
      }

      const depthTextureDesc: GPUTextureDescriptor = {
         size: [this.canvas.width, this.canvas.height, 1],
         dimension: '2d',
         format: 'depth24plus-stencil8',
         usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      }

      this.depthTexture = this.device.createTexture(depthTextureDesc)
      this.depthTextureView = this.depthTexture.createView()
   }

   // ✍️ Write commands to send to the GPU
   encodeCommands() {
      const clearValue: GPUColor = [0.3, 0.3, 0.3, 1.0]

      let colorAttachment: GPURenderPassColorAttachment = {
         view: this.colorTextureView,
         clearValue: clearValue,
         loadValue: clearValue,
         loadOp: 'clear',
         storeOp: 'store',
      }

      const depthAttachment: GPURenderPassDepthStencilAttachment = {
         view: this.depthTextureView,
         depthClearValue: 1,
         depthLoadValue: 1,
         depthLoadOp: 'clear',
         depthStoreOp: 'store',
         stencilClearValue: 0,
         stencilLoadValue: 0,
         stencilLoadOp: 'clear',
         stencilStoreOp: 'store',
      }

      const renderPassDesc: GPURenderPassDescriptor = {
         colorAttachments: [colorAttachment],
         depthStencilAttachment: depthAttachment,
      }

      this.commandEncoder = this.device.createCommandEncoder()

      // 🖌️ Encode drawing commands
      this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDesc)
      this.passEncoder.setPipeline(this.pipeline)
      this.passEncoder.setViewport(0, 0, this.canvas.width, this.canvas.height, 0, 1)
      this.passEncoder.setScissorRect(0, 0, this.canvas.width, this.canvas.height)
      this.passEncoder.setVertexBuffer(0, this.positionBuffer)
      this.passEncoder.setVertexBuffer(1, this.colorBuffer)
      this.passEncoder.setIndexBuffer(this.indexBuffer, 'uint16')
      this.passEncoder.drawIndexed(3, 1)

      if ('end' in this.passEncoder) this.passEncoder.end()
      // @ts-ignore FF
      else this.passEncoder.endPass()

      this.queue.submit([this.commandEncoder.finish()])
   }

   render = () => {
      // ⏭ Acquire next image from context
      this.colorTexture = this.context.getCurrentTexture()
      this.colorTextureView = this.colorTexture.createView()

      // 📦 Write and submit commands to queue
      this.encodeCommands()

      // ➿ Refresh canvas
      requestAnimationFrame(this.render)
   }
}

export function WebGPUSeed() {
   let canvasRef

   onMount(() => {
      const renderer = new Renderer(canvasRef)
      renderer.start()
   })

   return <canvas ref={canvasRef} width="350px" height="350px"></canvas>
}
