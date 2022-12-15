import { MetaProvider, Title } from '@solidjs/meta'
import { printBuildInfo } from './lib/build_info'
import { I18n } from './modules/i18n/i18n'
import { ThemeContextProvider } from './modules/theme.store'
import { SettingsProvider } from './modules/settings.store'
import { Toaster } from 'solid-toast'
import { BlokiAppRouter }from './modules/router'
import { render } from 'solid-js/web'

export function App() {
   if (import.meta.env.PROD) printBuildInfo()
   return (
      <MetaProvider>
         <Title>Bloki</Title>
         <SettingsProvider>
            <I18n>
               <ThemeContextProvider>
                  <BlokiAppRouter />
                  <Toaster />
               </ThemeContextProvider>
            </I18n>
         </SettingsProvider>
      </MetaProvider>
   )
}
// render(App, document.body)
