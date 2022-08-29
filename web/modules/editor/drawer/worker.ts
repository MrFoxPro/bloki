async function main() {
   globalThis.onmessage = (evt) => {
      console.log('got message', evt.data)
      const canvas = evt.data.canvas as HTMLCanvasElement
      const ctx = canvas.getContext('webgpu')
   }
   console.log('Starting worker for offscreen canvas')
   const adapter = await navigator.gpu.requestAdapter()
}
main()
