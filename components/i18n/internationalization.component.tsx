import { createI18nContext, I18nContext } from "@solid-primitives/i18n";
import { createEffect, PropsWithChildren } from "solid-js";
import Cookies from 'js-cookie';
import { useAppStore } from "@/lib/app.store";
const langs = {
   en: () => import('./langs/en.json').then(x => x.default),
   ru: () => import('./langs/ru.json').then(x => x.default),
   de: () => import('./langs/de.json').then(x => x.default),
} as const;

export const supportedLangs = Object.keys(langs) as (keyof typeof langs)[];

type InternationalizationProps = PropsWithChildren<{}>;

export function Internationalization(props: InternationalizationProps) {
   const [app, { setStore }] = useAppStore();

   const getInitialLocale = () => {
      let locale = Cookies.get('locale');
      if (supportedLangs.includes(locale as any)) {
         console.log('Locale found from cookie', locale);
         return locale as keyof typeof langs;
      }
      locale = navigator.language.slice(0, 2);
      if (supportedLangs.includes(locale as any)) {
         console.log('Locale found from navigator', locale);
         return locale as keyof typeof langs;
      }
      console.log('Locale was not initially found');
      return 'en';
   };

   setStore('locale', getInitialLocale());

   const i18n = createI18nContext({}, app.locale);
   const [, { add, locale, dict }] = i18n;

   createEffect(async () => {
      if (app.locale && !dict(app.locale)) {
         console.log('loading new locale', app.locale);
         const newDict = await langs[app.locale]();
         add(app.locale, newDict);
      }
      if (!app.locale) return;
      Cookies.set('locale', app.locale, { sameSite: 'strict' });
      locale(app.locale);
   });

   return (
      <I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>
   );
};