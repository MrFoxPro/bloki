import { createI18nContext, I18nContext } from "@solid-primitives/i18n";
import { createEffect, createResource, createSignal, onMount, PropsWithChildren, untrack } from "solid-js";
import Cookies from 'js-cookie';
import { useAppStore } from "@/lib/app.store";
const langs = {
   en: () => import('./langs/en.json').then(x => x.default),
   ru: () => import('./langs/ru.json').then(x => x.default),
   de: () => import('./langs/de.json').then(x => x.default),
} as const;

console.log(langs);
export const supportedLangs = Object.keys(langs) as (keyof typeof langs)[];

type InternationalizationProps = PropsWithChildren<{}>;

export function Internationalization(props: InternationalizationProps) {
   const [app] = useAppStore();

   const getInitialCookie = () => {
      let _locale = Cookies.get('locale');
      if (!supportedLangs.includes(_locale as any)) _locale = app.locale;
      return _locale as keyof typeof langs;
   };

   let [currLocale, setCurrLocale] = createSignal(getInitialCookie());

   const i18n = createI18nContext({}, currLocale());
   const [, { add, locale, dict }] = i18n;

   createEffect(() => {
      let locale = navigator.language.slice(0, 2);
      if (supportedLangs.includes(locale as any)) setCurrLocale(locale as any);
      else {
         Cookies.set('locale', currLocale(), { sameSite: 'strict' });
      }
   });

   createEffect(async () => {
      if (currLocale()) {
         if (!dict(currLocale())) {
            console.log('loading new locale');
            const newDict = await langs[currLocale()]();
            add(currLocale(), newDict);
         }
      }
   });

   createEffect(() => {
      console.log('app locale changed =)', app.locale);
      setCurrLocale(app.locale);
   });

   createEffect(() => {
      console.log('save current locale!', currLocale());
      Cookies.set('locale', currLocale(), { sameSite: 'strict' });
      locale(currLocale());
   });

   return (
      <I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>
   );
};