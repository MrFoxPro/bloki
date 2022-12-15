export const sizes = {
   sm: '640px',
   md: '768px',
   lg: '1024px',
   xl: '1280px',
   xxl: '1536px',
} as const

export const colors = {
   gray_900: '#1c1d1f',
   gray_850: '#27282b',
   gray_800: '#31373e',
   gray_750: '#323337',
   gray_700: '#51575e',
   gray_650: '#969596',
   gray_600: '#9ca5ab',
   gray_500: '#d8d8d8',
   gray_400: '#d7dcdf',
   gray_300: '#edf2f4',
   gray_200: '#f7f9fb',
   gray_000: '#ffffff',
   primary_orange_900: '#ffa61f',
   primary_orange_200: '#fdd08c',
   alert_red_900: '#da4929',
   alert_red_800: '#b56550',
   alert_red_400: '#f8ebe8',
   alert_red_300: '#fbebe7',
   alert_red_200: '#f8ebe8',
} as const

const breakpoints = {
   medium: 640,
   large: 1024,
} as const

const mediaBps = Object.keys(breakpoints).reduce((acc, item) => ({ ...acc, [item]: `@media screen and (min-width: ${breakpoints[item]}px)`, }), {})

export const media = {
   dark: '@media (prefers-color-scheme: dark)',
   ...mediaBps
}
