import { Mesh2D } from '../mesh/mesh'
import { MeshGroup } from '../mesh_group'
import { WebGPURenderer } from '../wgpurenderer'

export class PipelineAgent<TMesh extends Mesh2D> {
   readonly mGroups: MeshGroup<TMesh>[] = []
   private bindGroups: GPUBindGroup[] = []
   private shaderModule: GPUShaderModule
   private pipeline: GPURenderPipeline

   // internals
   private readonly binds = new Map<GPUBindGroupLayoutDescriptor, GPUBindGroupEntry[]>()

   constructor(readonly r: WebGPURenderer) {
      // this.shaderModule = this.r.device.createShaderModule({ code: })
   }
   addMeshGroup(group: MeshGroup<TMesh>) {
      this.mGroups.push(group)
   }
   addBindSet(group: GPUBindGroupLayoutDescriptor, entries: GPUBindGroupEntry[]) {
      this.binds.set(group, entries)
   }
   build() {
      const device = this.r.device

      this.bindGroups = []
      const bindGroupLayouts: GPUBindGroupLayout[] = []

      for (let [groupLayout, bindGroupEntries] of this.binds) {
         const layout = device.createBindGroupLayout(groupLayout)
         const bindGroup = device.createBindGroup({
            layout,
            entries: bindGroupEntries,
         })
         bindGroupLayouts.push(layout)
         this.bindGroups.push(bindGroup)
      }

      // WHERE TO PASS THIS
      const vertexLayout: GPUVertexState = {
         module: this.shaderModule,
         entryPoint: 'vertex',
         buffers: [
            {
               arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
               stepMode: 'vertex',
               attributes: [
                  {
                     format: 'float32x2',
                     offset: 0,
                     shaderLocation: 0,
                  },
               ],
            },
         ],
      }

      this.pipeline = device.createRenderPipeline({
         layout: device.createPipelineLayout({
            bindGroupLayouts,
         }),
         vertex: vertexLayout,
         fragment: {
            module: this.shaderModule,
            entryPoint: 'fragment',
            targets: [{ format: this.mainFormat }],
         },
         primitive: {
            topology: 'triangle-list',
         },
         multisample: {
            count: this._sampleCount,
         },
      })
   }
   recordRenderPass(pass: GPURenderPassEncoder) {
      for (let i = 0, n = this.bindGroups.length; i < n; i++) pass.setBindGroup(i, this.bindGroups[i])
      pass.setPipeline(this.pipeline)
      for (const mGroup of this.mGroups) mGroup.recordRenderPass(pass)
   }
}
