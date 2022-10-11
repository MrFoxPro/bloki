import { Mesh2D } from './mesh/mesh'
import { IndexedMeshGroup, MeshGroup } from './mesh_group'
import { FatLine2D } from './objects/line/line2d'
import { WebGPURenderer } from './wgpurenderer'

const SCENE_KEY = 'scene'
export class Scene2D {
   renderer: WebGPURenderer
   mgroup: MeshGroup
   async init(canvas: HTMLCanvasElement) {
      const r = new WebGPURenderer()
      this.renderer = await r.init(canvas)
      this.mgroup = new IndexedMeshGroup(this.renderer.device)
      this.renderer.addMeshGroup(this.mgroup)
   }
   get objects() {
      return Array.from(this.mgroup?.objects ?? [])
   }
   addObject(mesh: Mesh2D) {
      this.mgroup.addMesh(mesh)
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
         this.mgroup.removeMesh(obj)
      }
   }
   render() {
      this.renderer.render()
   }
}
