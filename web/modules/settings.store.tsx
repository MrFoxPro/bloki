import { createContextProvider } from '@solid-primitives/context'
import { createStore, SetStoreFunction } from 'solid-js/store'

type Settings = {
   name: string
}
export const [SettingsProvider, useSettings] = createContextProvider((props) => {
   const [settings, setSettings] = createStore<Settings>({ name: null })
   return { settings, setSettings }
})
