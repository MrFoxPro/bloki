import {
   defineConfig,
   presetUno,
   presetMini,
   presetWebFonts,
   presetAttributify,
   transformerVariantGroup,
   transformerAttributifyJsx,
   transformerDirectives,
   transformerCompileClass,
} from 'unocss'

export default defineConfig({
   include: [/\.tsx$/, /\.astro$/],
   theme: {
      colors: {
         grey: {
            900: '#1c1d1f',
            850: '#27282b',
            800: '#31373e',
            750: '#323337',
            700: '#51575e',
            650: '#969596',
            600: '#9ca5ab',
            500: '#d8d8d8',
            400: '#d7dcdf',
            300: '#edf2f4',
            200: '#f7f9fb',
            '000': '#ffffff',
         },
         orange: {
            900: '#ffa61f',
            400: '#fdd08c',
         },
         red: {
            950: '#4b2f2b',
            900: '#da4929',
            800: '#b56550',
            300: '#fbebe7',
            200: '#f8ebe8',
         },
      },
      fontFamily: {
         sans: "'Inter', sans-serif",
         vigril: "'Virgil'"
      },
   },
   presets: [
      presetAttributify(),
      // presetMini(),
      presetUno(),
   ],
   transformers: [
      // transformerAttributifyJsx({ include }),
      transformerVariantGroup({ separators: [':'] }),
   ],
})
