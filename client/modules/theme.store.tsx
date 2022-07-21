import Cookies from 'js-cookie';
import { createContext, createEffect, createSignal, on, ParentProps, Setter, useContext } from 'solid-js';

export enum Theme {
   Light = 'light',
   Dark = 'dark'
}
const THEME_COOKIE_KEY = 'theme';
function isSupportedTheme(theme: string): theme is Theme {
   return Object.values(Theme).includes(theme as Theme);
}

const ThemeContext = createContext({ theme: () => Theme.Light as Theme, setTheme: ((theme: Theme) => void 0) as Setter<Theme> });
export function ThemeContextProvider(props: ParentProps) {
   const preferDark = matchMedia('(prefers-color-scheme: dark)');
   function getInitialTheme() {
      let theme = Cookies.get(THEME_COOKIE_KEY) as Theme;
      if (!isSupportedTheme(theme)) {
         theme = preferDark.matches ? Theme.Dark : Theme.Light;
      }
      return theme;
   }
   const [theme, setTheme] = createSignal(getInitialTheme());
   preferDark.onchange = (event) => {
      const theme = event.matches ? Theme.Dark : Theme.Light;
      setTheme(theme);
   };

   createEffect(
      on(theme, (curr, prev) => {
         if (!document.body.classList.replace(prev, curr)) {
            document.body.classList.add(curr);
         }
         if (prev) {
            Cookies.set(THEME_COOKIE_KEY, curr);
         }
      })
   );
   return <ThemeContext.Provider value={{ theme, setTheme }}>{props.children}</ThemeContext.Provider>;
}

export const useThemes = () => useContext(ThemeContext);
