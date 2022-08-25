struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
}

struct FragmentInput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn vertex(vert: VertexInput) -> FragmentInput {
    var out: FragmentInput;
    out.color = vert.color;
    out.position = vert.position;
    return out;
}

@fragment
fn fragment(in: FragmentInput) -> @location(0) vec4<f32> {
    return in.color;
}
