export const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const lerp = (a, b, amount) => (1 - amount) * a + amount * b;

export const getRandomColor = () => "#" + ((1 << 24) * Math.random() | 0).toString(16);

export const mapValuesArray = (m: Map<any, any>) => Array.from(m.values());