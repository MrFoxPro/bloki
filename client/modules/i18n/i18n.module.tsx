import { Accessor, createContext, createEffect, createMemo, on, PropsWithChildren, useContext } from "solid-js";
import Cookies from 'js-cookie';
import type { BaseTranslation } from "./langs/ru.lang";
import { createSignal } from "solid-js";

const LOCALE_COOKIE_KEY = 'locale';

const langs = {
	'en': () => import('./langs/en.lang').then(l => l.default),
	'ru': () => import('./langs/ru.lang').then(l => l.default),
	'zh-cn': () => import('./langs/zh-cn.lang').then(l => l.default)
} as const;

type Lang = keyof typeof langs;

function isSupportedLocale(locale: string): locale is Lang {
	return Object.keys(langs).includes(locale as Lang);
}

function getInitialLang() {
	let locale = Cookies.get('locale') ?? '';
	if (isSupportedLocale(locale)) {
		return locale;
	}
	locale = navigator.language.slice(0, 2);
	if (isSupportedLocale(locale)) {
		return locale;
	}
	return 'en';
};

const initialLocale = getInitialLang();
const initialDict = await langs[initialLocale]();

type I18nContextType = {
	lang: Accessor<Lang>;
	LL: Accessor<BaseTranslation>;
	loadLang: (lang: Lang) => Promise<void>;
};
const I18nContext = createContext<I18nContextType>({
	lang: () => 'en',
	LL: () => ({}) as BaseTranslation,
	loadLang: () => void 0
});

type i18nProps = PropsWithChildren<{}>;
export function I18n(props: i18nProps) {
	let langDict: Partial<Record<Lang, BaseTranslation>> = {};

	const [lang, setLang] = createSignal(initialLocale);
	const LL = createMemo(() => langDict[lang()] ?? initialDict);

	async function loadLang(lang: Lang) {
		if (!langDict[lang]) {
			langDict[lang] = await langs[lang]();
		}
		setLang(lang);
	}

	createEffect(on(
		lang,
		() => {
			console.log('Locale saved to cookies');
			Cookies.set(LOCALE_COOKIE_KEY, lang(), { sameSite: 'strict' });
		},
		{ defer: true })
	);

	return (
		<I18nContext.Provider value={{ LL, lang, loadLang }}>
			{props.children}
		</I18nContext.Provider>
	);
};

export const useI18n = () => useContext(I18nContext);