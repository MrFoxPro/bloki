precision mediump float;

uniform vec2 resolution;
uniform vec4 color;

void main() {
   // vec2 uv = gl_FragCoord.xy / resolution;
   // float color = 0.0;
   // gl_FragColor = vec4(0.09, 0.18, 0.76, 1);
   gl_FragColor = color;
}
