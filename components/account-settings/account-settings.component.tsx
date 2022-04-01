import { useAppStore } from '@/lib/app.store';
import { useI18n } from '@solid-primitives/i18n';
import s from './account-settings.module.scss';
import LayoutIcon from './assets/layout.icon.svg';
import LanguageIcon from './assets/language.icon.svg';
import { createSignal, For } from 'solid-js';
import { supportedLangs } from '../i18n/internationalization.component';
import { Dynamic } from 'solid-js/web';

export function AccountSettings() {
   const [app, { setStore }] = useAppStore();
   const [t] = useI18n();

   const [selectedItem, setSelectedItem] = createSignal<'layout' | 'language'>('language');

   const LanguageSettings = () => {
      return (
         <select name="lang"
            onChange={(e) => {
               if (e.currentTarget.selectedIndex === 0) return;
               setStore('locale', supportedLangs[e.currentTarget.selectedIndex - 1]);
            }}
            value={app.locale}
         >
            <option>{t('settings.system.modal.language.select-language')}</option>
            <For each={supportedLangs}>
               {lang => (<option value={lang}>{lang}</option>)}
            </For>
         </select>
      );
   };

   const settingsMap = {
      language: LanguageSettings
   };

   return (
      <div class={s.accountSettings}>
         <div class={s.menu}>
            <div class={s.title}>
               {t('settings.system.modal.menu.title')}
            </div>
            <div class={s.items}>
               <div class={s.title}>{t('settings.system.modal.menu.general')}</div>
               <div
                  class={s.item}
                  classList={{ [s.itemHighlighed]: selectedItem() === 'layout' }}
                  onClick={() => setSelectedItem('layout')}
               >
                  <LayoutIcon />
                  <span>{t('settings.system.modal.menu.item.layout')}</span>
               </div>
               <div
                  class={s.item}
                  classList={{ [s.itemHighlighed]: selectedItem() === 'language' }}
                  onClick={() => setSelectedItem('language')}
               >
                  <LanguageIcon />
                  <span>
                     {t('settings.system.modal.menu.item.language')}
                  </span>
               </div>

            </div>
         </div>
         <div class={s.settingsView}>
            <Dynamic component={settingsMap[selectedItem()]} />
         </div>

      </div>
   );
}