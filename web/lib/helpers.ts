export const sleep = async (time) => new Promise((res) => setTimeout(res, time))

export const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export const lerp = (a, b, amount) => (1 - amount) * a + amount * b

export const getRandomColor = () => '#' + (((1 << 24) * Math.random()) | 0).toString(16)

export const mapValuesArray = (m: Map<any, any>) => Array.from(m.values())

export const emailRegex =
   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const capacitor = (func: Function, times = 2, maxDelayMs = 200) => {
   let timesWasFired = 0
   let lastTimeWasFired = 0
   return function () {
      const now = performance.now()
      if (now - lastTimeWasFired > maxDelayMs) {
         lastTimeWasFired = now
         timesWasFired = 1
         return
      }
      timesWasFired++
      lastTimeWasFired = now
      if (timesWasFired >= times) {
         timesWasFired = 0
         func.apply(this, arguments)
      }
   }
}

export type TOrTArray<T> = T | T[]

export function isValidHex(color: string) {
   if (!color || typeof color !== 'string') return false

   // Validate hex values
   if (color.substring(0, 1) === '#') color = color.substring(1)

   switch (color.length) {
      case 3:
         return /^[0-9A-F]{3}$/i.test(color)
      case 6:
         return /^[0-9A-F]{6}$/i.test(color)
      case 8:
         return /^[0-9A-F]{8}$/i.test(color)
      default:
         return false
   }
}
