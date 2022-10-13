import { IndexedMeshGroup } from './mesh_group'
import { FatLine2D } from './objects/line/line2d'
import { Chunk } from './pool'
import { UBO_ARRAY } from './utils'
import { Renderer } from './output'

const SCENE_KEY = 'scene'
export class Scene2D {
   renderer: Renderer
   mgroup: IndexedMeshGroup
   viewport: [x0: number, y0: number, wtf: number, zoom: number] = [0, 0, 10, 1]
   viewportChunk: Chunk
   clrChunk: Chunk
   _zoom: number = 1
   async init(canvas: HTMLCanvasElement) {
      this.renderer = new Renderer()
      await this.renderer.init(canvas)
      this.mgroup = new IndexedMeshGroup(this.renderer)
      this.renderer.addMeshGroup(this.mgroup)

      this.viewport = [canvas.width / 2, canvas.height / 2, 10, this._zoom]
      this.viewportChunk = this.mgroup.ubo.create(this.viewport, 256 / Float32Array.BYTES_PER_ELEMENT)
      const color = [1, 0.5, 0.5, 1]
      this.clrChunk = this.mgroup.ubo.create(color, 256 / Float32Array.BYTES_PER_ELEMENT)

      this.renderer.buildPipelines()
      const viewportBG = this.renderer.device.createBindGroup({
         layout: this.renderer.pipeline.getBindGroupLayout(0),
         entries: [
            {
               binding: 0,
               resource: {
                  offset: 0,
                  size: 4 * Float32Array.BYTES_PER_ELEMENT,
                  buffer: this.mgroup.ubo.buffer,
               },
            },
         ],
      })
      this.renderer.globalBindGroups.push({
         index: 0,
         group: viewportBG,
      })
      this.renderer.render()
   }
   get zoom() {
      return this._zoom
   }
   set zoom(value: number) {
      if (this._zoom === value) return
      this._zoom = value
      this.renderer.device.queue.writeBuffer(
         this.viewportChunk.manager.buffer,
         3 * UBO_ARRAY.BYTES_PER_ELEMENT,
         new UBO_ARRAY([value])
      )
   }
   addObject(mesh: FatLine2D) {
      this.mgroup.addMesh(mesh)
   }
   get objects() {
      return Array.from(this.mgroup?.objects ?? [])
   }
   load(key: string = 'scene') {
      const item = localStorage.getItem(key)
      if (!item) return
      const meshes = JSON.parse(item)
      if (!meshes) return
      for (const obj of meshes) {
         const mesh = new FatLine2D()
         this.addObject(mesh)
         mesh.deserialize(obj)
      }
   }
   save() {
      const serialized = this.objects.map((o) => o.serialize())
      const json = JSON.stringify(serialized)
      localStorage.setItem(SCENE_KEY, json)
   }
   flush() {
      localStorage.removeItem(SCENE_KEY)
      for (const obj of this.objects) {
         this.mgroup.removeMesh(obj)
      }
   }
   render() {
      this.renderer.render()
   }
}
