import { createContext, createEffect, createSignal, on, ParentProps, Setter, useContext } from 'solid-js';

export enum Theme {
   Light = 'light',
   Dark = 'dark'
}

const ThemeContext = createContext({ theme: () => Theme.Light as Theme, setTheme: ((theme: Theme) => void 0) as Setter<Theme> });

export function ThemeContextProvider(props: ParentProps) {
   const [theme, setTheme] = createSignal(Theme.Light);

   createEffect(() => {
      const match = matchMedia('(prefers-color-scheme: dark)');
      if (match.matches) {
         setTheme(Theme.Dark);
      }
      match.onchange = (event) => {
         const newColorScheme = event.matches ? Theme.Dark : Theme.Light;
         setTheme(newColorScheme);
      };
   });

   createEffect(
      on(theme, (curr, prev) => {
         if (prev) {
            document.body.classList.replace(prev, curr);
            return;
         }
         document.body.classList.toggle(curr);
      })
   );
   return <ThemeContext.Provider value={{ theme, setTheme }}>{props.children}</ThemeContext.Provider>;
}

export const useThemes = () => useContext(ThemeContext);
