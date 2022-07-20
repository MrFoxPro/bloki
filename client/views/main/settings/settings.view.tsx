import './settings.view.scss';
import ResetIcon from './assets/reset.svg';
import { createStore } from 'solid-js/store';
import { langs, languages, setLang, lang, LANGS_META } from '@/modules/i18n/i18n.module';
import { Switch } from '@/components/input-switch/input-switch';
import { Dynamic, For, Show } from 'solid-js/web';
import { useBuildInfo } from '@/lib/build-info';
import { RadioLine } from '@/components/radio-line/radio-line';
import { Theme, useThemes } from '@/modules/theme.store';
import { DropdownInput } from '@/components/input/input-dropdown';

const Appearance = () => {
   const { theme, setTheme } = useThemes();
   const LANG_OPTIONS = languages
      .filter((x) => x !== 'zh')
      .map((lang) => ({ key: lang, label: LANGS_META[lang].name_eng, prefix: LANGS_META[lang].emoji }));
   return (
      <>
         <fieldset>
            <DropdownInput
               options={/*@once*/ LANG_OPTIONS}
               title={LANGS_META[lang()].emoji.concat(' ', t().appearance.lang)}
               selectedKey={lang()}
               onSelect={(opt) => setLang(opt.key as typeof languages[number])}
            />
         </fieldset>
         <fieldset>
            <legend>{t().appearance.theme.legend}</legend>
            {Object.values(Theme).map((th) => (
               <RadioLine name="theme" id={`theme-${th}`} checked={th === theme()} onInput={(e) => setTheme(th)}>
                  <label for={`theme-${th}`}>{t().appearance.theme[th]}</label>
               </RadioLine>
            ))}
         </fieldset>
      </>
   );
};
const System = () => (
   <>
      <fieldset class="control-group">
         <label>{t().system.touch_area}</label>
         <div class="panel">
            <input type="range" class="range" id="resize-additional-zone" min="0" max="100" />
            <input class="numeric" />
            <ResetIcon class="reset" />
         </div>
      </fieldset>
      <fieldset class="control-group">
         <label>{t().system.block_corners_margin}</label>
         <div class="panel">
            <input type="range" class="range" id="resize-additional-zone" min="0" max="100" />
            <input class="numeric" />
            <ResetIcon class="reset" />
         </div>
      </fieldset>
      <fieldset>
         <legend>{t().system.show_grid}</legend>
         <Switch checked />
      </fieldset>
   </>
);
const Changes = () => {
   const { text } = useBuildInfo();
   return <pre>{text}</pre>;
};

export function SettingsView() {
   const views = {
      appearance: Appearance,
      system: System,
      changes: Changes
   } as const;
   const MENU_LAYOUT = [
      ['app', ['appearance', 'system']],
      [, ['changes']]
   ] as const;
   const [store, setStore] = createStore({
      route: Object.keys(views)[0],
      system: {
         touchZone: 10,
         controlsOffset: 10,
         showGrid: false
      }
   });
   return (
      <>
         <div class="menu">
            {MENU_LAYOUT.map(([header, items]) => (
               <div class="items bottom-line">
                  <Show when={header}>
                     <div class="name">{t().menu[header]._header_}</div>
                  </Show>
                  <For each={items}>
                     {(item) => (
                        <div
                           class="item"
                           classList={{
                              highlighted: store.route === item
                           }}
                           onClick={() => setStore('route', item)}
                        >
                           {header ? t().menu[header][item] : t().menu[item]}
                        </div>
                     )}
                  </For>
               </div>
            ))}
         </div>
         <div class="content">
            <Dynamic component={views[store.route]} />
         </div>
      </>
   );
}
export default SettingsView;

const t = langs({
   en: {
      menu: {
         // personal: {
         //    _header_: 'Personal',
         //    account: 'Account',
         //    integrations: 'Integrations'
         // },
         app: {
            _header_: 'Application',
            appearance: 'Appearance',
            system: 'System'
            // lang: 'Language',
            // keyboard: 'Keyboard'
         },
         changes: 'Changes'
         // logout: 'Log out'
      },
      appearance: {
         lang: 'Language',
         theme: {
            legend: 'Color theme',
            light: 'Light',
            dark: 'Dark',
            system: 'System'
         }
      },
      system: {
         touch_area: 'Touch area size (px.)',
         block_corners_margin: 'Space between block and it`s corners',
         show_grid: 'Show grid'
      }
   },
   ru: {
      menu: {
         // personal: {
         //    _header_: 'Персональные',
         //    account: 'Учётная запись',
         //    integrations: 'Интеграции'
         // },
         app: {
            _header_: 'Приложение',
            appearance: 'Внешний вид',
            system: 'Система'
            // lang: 'Язык',
            // keyboard: 'Сочетания клавиш'
         },
         changes: 'Список изменений'
         // logout: 'Выйти'
      },
      appearance: {
         lang: 'Мова',
         theme: {
            legend: 'Цветовая тема',
            light: 'Светлая',
            dark: 'Тёмная',
            system: 'Как в системе'
         }
      },
      system: {
         touch_area: 'Дополнительная зона касания (пикс.)',
         block_corners_margin: 'Отступ контролов от блока',
         show_grid: 'Отображение сетки'
      }
   }
});
