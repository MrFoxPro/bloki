export const capacitor = (func: Function, times = 2, maxDelayMs = 200) => {
   let timesWasFired = 0;
   let lastTimeWasFired = 0;
   return function () {
      const now = performance.now()
      if (now - lastTimeWasFired > maxDelayMs) {
         lastTimeWasFired = now;
         timesWasFired = 1;
         return;
      }
      timesWasFired++;
      lastTimeWasFired = now;
      if (timesWasFired >= times) {
         timesWasFired = 0;
         func.apply(this, arguments);
      }
   }
}