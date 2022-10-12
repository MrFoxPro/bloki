{
   const ARRAY_SIZE = 5 * 10 ** 6
   function obj_push() {
      const arr = []
      const start = performance.now()
      for (let i = 0; i < ARRAY_SIZE; i++) {
         const obj = { x: Math.random(), y: Math.random() }
         arr.push(obj)
      }
      return performance.now() - start
   }
   function plain_push() {
      const arr = []
      const start = performance.now()
      for (let i = 0; i < ARRAY_SIZE; i++) {
         const tuple = [Math.random(), Math.random()]
         arr.push(...tuple)
      }
      return performance.now() - start
   }
   function tuple_push() {
      const arr = []
      const start = performance.now()
      for (let i = 0; i < ARRAY_SIZE; i++) {
         const tuple = [Math.random(), Math.random()]
         arr.push(tuple)
      }
      return performance.now() - start
   }
}
function run(toRun, label = toRun.name, times = 20) {
   const results = []
   for (let i = 0; i < times; i++) {
      results.push(toRun())
   }
   const avg = Math.trunc(results.reduce((a, b) => a + b, 0) / times)
   console.log(label, 'avg:', avg)
}

run(obj_push)
run(plain_push)
run(tuple_push)
