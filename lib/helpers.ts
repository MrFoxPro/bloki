export function upperFirst(str: string) {
   return str.charAt(0).toUpperCase() + str.slice(1);
}
export const lerp = (a, b, amount) => (1 - amount) * a + amount * b;
