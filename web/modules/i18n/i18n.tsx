import { BlokiCookieKey, BlokiCookies } from '@/lib/cookies'
import {
   Accessor,
   createContext,
   createSignal,
   createMemo,
   createEffect,
   on,
   useContext,
   createRoot,
   onCleanup,
   getOwner,
   ParentProps,
} from 'solid-js'

// https://ru.wikipedia.org/wiki/%D0%9A%D0%BE%D0%B4%D1%8B_%D1%8F%D0%B7%D1%8B%D0%BA%D0%BE%D0%B2
export const languages = ['en', 'ru', 'zh'] as const
export type Lang = typeof languages[number]
export const LANGS_META: Record<Lang, { emoji: string; name_eng: string }> = {
   en: { emoji: '🇬🇧', name_eng: 'English' },
   ru: { emoji: '🇷🇺', name_eng: 'Russian' },
   zh: { emoji: '🇨🇳', name_eng: 'Chineese' },
}

function isSupportedLocale(locale: string): locale is Lang {
   return languages.includes(locale as Lang)
}

function getInitialLang() {
   let locale = BlokiCookies.get(BlokiCookieKey.Language)
   if (isSupportedLocale(locale)) {
      return locale
   }
   locale = navigator.language.slice(0, 2)
   if (isSupportedLocale(locale)) {
      return locale
   }
   return 'en'
}

const initialLocale = getInitialLang()

type I18nContextType = {
   lang: Accessor<Lang>
   setLang: (lang: Lang) => Promise<void>
}
const I18nContext = createContext<I18nContextType>({
   lang: () => 'en' as const,
   setLang: () => void 0,
})

type Primitive = string | number | boolean
type LangFunction = (...args: Primitive[]) => string
interface Dict extends Record<string, string | LangFunction | Dict> {}
type LangDict = Partial<Record<Lang, Dict>>

type UnConst<T> = T extends string
   ? string
   : T extends (...args: infer A) => unknown
   ? T & { __length: A['length'] }
   : {
        [K in keyof T]: UnConst<T[K]>
     }

type RemoveLength<T> = T extends string
   ? string
   : T extends (...args: infer A) => infer R
   ? (...args: A) => R
   : {
        [K in keyof T]: RemoveLength<T[K]>
     }

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
   ? I
   : never

export const [{ lang, langs, setLang }, disposeLangRoot] = createRoot((d) => {
   const [lang, setLang] = createSignal(initialLocale)
   function langs<T extends LangDict>(
      dict: T & Record<keyof T, RemoveLength<UnionToIntersection<UnConst<T[keyof T]>>>>
   ) {
      const handler = () => dict[lang()]
      if (getOwner()) return createMemo(handler)
      return handler
   }
   return [{ lang, setLang, langs }, d] as const
})

export function I18n(props: ParentProps<{}>) {
   createEffect(
      on(
         lang,
         () => {
            console.log('Locale saved to cookies')
            BlokiCookies.set(BlokiCookieKey.Language, lang())
         },
         { defer: true }
      )
   )
   onCleanup(disposeLangRoot)
   return <I18nContext.Provider value={{ lang, setLang }}>{props.children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
