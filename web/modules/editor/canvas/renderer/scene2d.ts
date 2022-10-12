import { Chunk } from './buffer/chunk'
import { Pool } from './buffer/pool'
import { Mesh2D } from './mesh/mesh'
import { IndexedMeshGroup, MeshGroup } from './mesh_group'
import { FatLine2D } from './mesh/line/line2d'
import { UBO_ARRAY } from './utils'
import { WebGPURenderer } from './wgpurenderer'
import { PipelineAgent } from './pipelines/pipeline_agent'

const SCENE_KEY = 'scene'
export class Scene2D {
   r: WebGPURenderer
   mgroup: MeshGroup
   vpChunk: Chunk
   async init(canvas: HTMLCanvasElement) {
      // const b = new PipelineAgent()
      // b.addBindSet()
      const r = new WebGPURenderer()
      this.r = await r.init(canvas)
      this.mgroup = new IndexedMeshGroup(this.r.device)
      // this.r.addMeshGroup(this.mgroup)

      const vp = [canvas.width / 2, canvas.height / 2, 10, this._zoom]
      const ubo = new Pool(this.r.device, new UBO_ARRAY(vp), GPUBufferUsage.UNIFORM)
      this.vpChunk = ubo.create(vp)
   }
   get objects() {
      return Array.from(this.mgroup?.objects ?? [])
   }
   addObject(mesh: Mesh2D) {
      this.mgroup.add(mesh)
   }
   private _zoom = 1

   public get zoom() {
      return this._zoom
   }
   public set zoom(value: number) {
      if (this._zoom === value) return
      this._zoom = value
      this.r.device.queue.writeBuffer(
         this.vpChunk.manager.buffer,
         3 * UBO_ARRAY.BYTES_PER_ELEMENT,
         new UBO_ARRAY([value])
      )
   }
   load(key: string = 'scene') {
      const item = localStorage.getItem(key)
      if (!item) return
      const meshes = JSON.parse(item)
      if (!meshes) return
      for (const obj of meshes) {
         const mesh = new FatLine2D(obj.points, obj.style)
         mesh.color = obj.color
         mesh.build()
         this.addObject(mesh)
      }
   }
   save() {
      const json = JSON.stringify(
         // @ts-ignore
         this.objects.map((o) => ({ points: o.points, style: o.style, color: o.color }))
      )
      localStorage.setItem(SCENE_KEY, json)
   }
   flush() {
      localStorage.removeItem(SCENE_KEY)
      for (const obj of this.objects) {
         this.mgroup.remove(obj)
      }
   }
   render() {
      this.r.render()
   }
}
