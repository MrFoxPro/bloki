import { Accessor, createContext, createMemo, createSignal, ParentProps, Setter, useContext } from 'solid-js'
import { Meta } from '@solidjs/meta'
import { BlokiCookieKey, BlokiCookies } from '@/lib/cookies'

export enum Theme {
   Light = 'light',
   Dark = 'dark',
}
function isSupportedTheme(theme: string): theme is Theme {
   return Object.values(Theme).includes(theme as Theme)
}

const ThemeContext = createContext({
   theme: () => Theme.Light as Theme,
   setTheme: ((theme: Theme) => void 0) as Setter<Theme>,
   transitTheme: (t0: Theme) => void 0,
   createCSSColorMemo: (colorName: string, el?: HTMLElement) => () => null as string,
})

export function ThemeContextProvider(props: ParentProps) {
   let actualTheme: Theme | null = null
   const preferDark = matchMedia('(prefers-color-scheme: dark)')

   function getInitialTheme() {
      let theme = BlokiCookies.get(BlokiCookieKey.Theme) as Theme
      if (!isSupportedTheme(theme)) {
         theme = preferDark.matches ? Theme.Dark : Theme.Light
      }
      return theme
   }
   const getCSSColor = (colorName: string, el = document.body) => getComputedStyle(el).getPropertyValue(colorName)
   const [theme, setTheme] = createSignal(getInitialTheme())
   const [themeColor, setThemeColor] = createSignal<string>(getCSSColor('--color-bg-main'))

   const createCSSColorMemo = (colorName: string, el = document.body) =>
      createMemo(() => {
         theme()
         return getCSSColor(colorName, el)
      })

   applyTheme(theme())

   function transitTheme(to: Theme) {
      document.body.classList.add('switch-theme')
      applyTheme(to)
      queueMicrotask(() => {
         document.body.classList.remove('switch-theme')
         setTheme(to)
      })
   }

   function applyTheme(theme: Theme) {
      if (actualTheme) {
         document.body.classList.replace(actualTheme, theme)
      } else document.body.classList.add(theme)
      setThemeColor(getCSSColor('--color-bg-main'))
      if (actualTheme) {
         BlokiCookies.set(BlokiCookieKey.Theme, theme)
      }
      actualTheme = theme
   }

   preferDark.onchange = (event) => {
      const theme = event.matches ? Theme.Dark : Theme.Light
      setTheme(theme)
   }

   return (
      <ThemeContext.Provider value={{ theme, setTheme, transitTheme, createCSSColorMemo }}>
         <Meta name="theme-color" content={themeColor()} />
         {props.children}
      </ThemeContext.Provider>
   )
}

export const useThemeContext = () => useContext(ThemeContext)
