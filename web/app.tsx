import '@/styles/app.scss'
import './lib/ext'

import { MetaProvider, Title } from '@solidjs/meta'
import { printBuildInfo } from './lib/build_info'
import { I18n } from './modules/i18n/i18n.module'
import { ThemeContextProvider } from './modules/theme.store'
import { BlokiAppRouter } from './views/router'
import { SettingsProvider } from './modules/settings.store'
import { Toaster } from 'solid-toast'

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
