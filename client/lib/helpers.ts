export const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const lerp = (a, b, amount) => (1 - amount) * a + amount * b;

export const getRandomColor = () => '#' + (((1 << 24) * Math.random()) | 0).toString(16);

export const mapValuesArray = (m: Map<any, any>) => Array.from(m.values());

export const emailRegex =
   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const capacitor = (func: Function, times = 2, maxDelayMs = 200) => {
   let timesWasFired = 0;
   let lastTimeWasFired = 0;
   return function () {
      const now = performance.now();
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
   };
};

export type TOrTArray<T> = T | T[];
