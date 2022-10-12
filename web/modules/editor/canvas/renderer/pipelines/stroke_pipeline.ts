import { Point2DTupleView } from '@/modules/editor/types'
import { Chunk } from '../buffer/chunk'

export interface Material {
   readonly Shader: string
   readonly VertexBufferLayout: GPUVertexBufferLayout[]
   pipeline?: GPURenderPipeline
}

class Stroke2DSingleColorMaterial implements Material {
   Shader = /*wgsl*/ `
      struct Uniforms {
         viewPort: vec4<f32>
      }
      @binding(0) @group(0) var<uniform> uniforms : Uniforms;
      struct VertexInput {
         @location(0) position: vec2<f32>,
         @location(1) color: vec4<f32>,
      }
      struct VSOutput {
         @builtin(position) position: vec4<f32>,
         @location(0) color: vec4<f32>,
      }
      @vertex
      fn vertex(vert: VertexInput) -> VSOutput {
         var out: VSOutput;
         out.color = vert.color;
         out.position = vec4(vert.position.xy, 0.0, 1.0) / uniforms.viewPort;
         return out;
      }
      @fragment
      fn fragment(in: VSOutput) -> @location(0) vec4<f32> {
         return in.color;
      }
`
   VertexBufferLayout: GPUVertexBufferLayout[] = [
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
   ]
}

interface Mesh {
   material: Material
}

const defaultStrokeMaterial = new Stroke2DSingleColorMaterial()
class Stroke2D implements Mesh {
   private _position: Point2DTupleView
   private _color = [1, 0, 0, 1]
   material: Material = defaultStrokeMaterial
}

class RenderPassBuilder {
   materialPipelineMap = new Map<any, GPURenderPipeline>
   constructor(public readonly objects: readonly Mesh[] = []) {}


   addObject(mesh: Mesh) {
      if (!mesh.material) console.warn('No material is set for', mesh)

   }
   build() {}
}
