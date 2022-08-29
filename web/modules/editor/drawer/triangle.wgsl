struct VertexInput {
   @location(0) position: vec4<f32>,
   @location(1) color: vec4<f32>,
}

struct VSOutput {
   @builtin(position) position: vec4<f32>,
   @location(0) color: vec4<f32>,
}

struct Uniforms {
   viewPort: vec4<f32>
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

@vertex
fn vertex(vert: VertexInput) -> VSOutput {
   var out: VSOutput;
   out.color = vert.color;
   out.position = vert.position / uniforms.viewPort;
   return out;
}

@fragment
fn fragment(in: VSOutput) -> @location(0) vec4<f32> {
   return in.color;
}
