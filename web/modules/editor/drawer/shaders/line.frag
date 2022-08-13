// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

void main() {
// gl_FragColor is a special variable a fragment shader
// is responsible for setting
   gl_FragColor = vec4(0.02, 1, 0.18, 1); // return reddish-purple
}
