import { onMount } from 'solid-js'
import * as twgl from 'twgl.js'

import FragmetShader from './test.frag?raw'
import VertexShader from './test.vert?raw'

export default function DevView() {
   return (
      <div>
         Dev view
         <h2>Drawer</h2>
         <Drawer />
      </div>
   )
}
function Drawer() {
   let drawerRef: HTMLCanvasElement
   let mouseDown = false
   onMount(() => {
      const gl = drawerRef.getContext('webgl2')
      const programInfo = twgl.createProgramInfo(gl, [VertexShader, FragmetShader])
      const arrays = {
         position: [
            // p1
            -1, -1, 0,
            //  p2
            1, -1, 0,
            //  p3
            -1, 1, 0,
            //   p4
            -1, 1, 0,
            // p5
            1, -1, 0,
            //  p6
            1, 1, 0,
         ],
      }
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
      function render(time) {
         twgl.resizeCanvasToDisplaySize(gl.canvas)
         gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
         const uniforms = {
            color: new Float32Array([0.3, 0.18, 0.56, 1]),
         }

         gl.useProgram(programInfo.program)
         twgl.setUniforms(programInfo, uniforms)
         twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
         twgl.drawBufferInfo(gl, bufferInfo)
         requestAnimationFrame(render)
      }
      requestAnimationFrame(render)
   })
   return (
      <canvas
         style={{
            width: '1000px',
            height: '800px',
         }}
         ref={drawerRef}
         onMouseDown={() => (mouseDown = true)}
      />
   )
}
