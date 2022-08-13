attribute vec2 a_pos;

uniform vec3 u_cam;
uniform vec2 u_res;

vec2 tr(vec2 c) {
   return (c / u_res * 2.0 - 1.0) * vec2(1, -1);
}

void main() {
   vec2 pos = a_pos;
   pos.xy += u_cam.xy;
   pos = tr(pos);
   gl_Position = vec4(pos, 0, u_cam.z);
}
