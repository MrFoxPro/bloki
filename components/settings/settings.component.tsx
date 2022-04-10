import { useAppStore } from '@/lib/app.store';
import { useI18n } from '@solid-primitives/i18n';
import s from './settings.module.scss';
import LayoutIcon from './assets/layout.icon.svg';
import LanguageIcon from './assets/language.icon.svg';
import SettingsIcon from '@/components/side-menu/assets/settings.icon.svg';
import { createComputed, createSignal, For, Show } from 'solid-js';
import { supportedLangs } from '../i18n/internationalization.component';
import { Dynamic } from 'solid-js/web';
import { getTextBlockSize } from '../bloki-editor/blocks/text/helpers';
import { isTextBlock } from '../bloki-editor/types/blocks';
import { NAME_MAX_LENGTH } from '../modals/name-input/name-input.modal';

let lastOpenedItem = 'general';
export function Settings() {
   const [app, { setAppStore, selectedDocument }] = useAppStore();
   const [t] = useI18n();

   const [selectedItem, setSelectedItem] = createSignal<'general' | 'graphics' | 'doc-layout'>(lastOpenedItem);

   createComputed(() => {
      lastOpenedItem = selectedItem();
   });

   function updateDoc(...args: []) {
      setAppStore('documents', (d => d.id === app.selectedDocumentId), ...args);
   }

   const GeneralSettings = () => {
      let name = app.name;
      return (
         <>
            <div class={s.block}>
               <div class={s.name}>{t('settings.system.modal.name.title')}</div>
               <div class={s.nickname}>
                  <input type="text" value={app.name} onChange={(e) => name = e.currentTarget.value} />
                  <button onClick={(e) => {
                     if (name.length < 1 || name.length > NAME_MAX_LENGTH) {
                        return alert('Name is too short/long!');
                     }
                     setAppStore({ name });
                  }}>
                     {t('settings.system.modal.name.save')}
                  </button>
               </div>
            </div>
            <div class={s.block}>
               <div class={s.name}>{t('settings.system.modal.menu.item.language')}</div>
               <select name="lang"
                  onChange={(e) => {
                     if (e.currentTarget.selectedIndex === 0) return;
                     console.log('selected lang', supportedLangs[e.currentTarget.selectedIndex - 1]);
                     setAppStore('locale', supportedLangs[e.currentTarget.selectedIndex - 1]);
                  }}
               >
                  <option>{t('settings.system.modal.language.select-language')}</option>
                  <For each={/*@once*/supportedLangs}>
                     {lang => (<option value={lang} selected={app.locale === lang}>{t(`system.language.${lang}`)}</option>)}
                  </For>
               </select>
            </div>
         </>
      );
   };
   const GraphicsSettings = () => {
      function logCalculatedSizes() {
         selectedDocument().blocks.forEach(block => {
            if (isTextBlock(block)) {
               getTextBlockSize(block.type, block.fontFamily, block.value, selectedDocument().layoutOptions);
            }
         });
      }
      return (
         <Show when={selectedDocument()}>
            <div class={s.check}>
               <input
                  type="checkbox"
                  name="show-gradient"
                  onClick={(e) => updateDoc('layoutOptions', 'showGridGradient', e.currentTarget.checked)}
                  checked={selectedDocument().layoutOptions.showGridGradient}
               />
               <label for="show-gradient">{t('settings.document.grid-gradient')}</label>
            </div>
            <div class={s.check}>
               <input
                  type="checkbox"
                  name="show-resizers"
                  onClick={(e) => updateDoc('layoutOptions', 'showResizeAreas', e.currentTarget.checked)}
                  checked={selectedDocument().layoutOptions.showResizeAreas}
               />
               <label for="show-resizers">{t('settings.document.resize-areas')}</label>
            </div>
            <div class={s.gridType}>
               <div>
                  {t("settings.system.render-method.title")}
               </div>
               <div class={s.methods}>
                  {(['canvas', 'dom'] as const).map((type) => (
                     <div>
                        <input
                           type="radio"
                           id={type + 'method'}
                           checked={app.gridRenderMethod === type}
                           onInput={() => setAppStore({ gridRenderMethod: type })} />
                        <label for={type + 'method'}>{t(`settings.system.render-method.${type}`)}</label>
                     </div>
                  ))}
               </div>
            </div>
            <button
               onClick={logCalculatedSizes}
            >
               {t('settings.document.log-calculated-sizes')}
            </button>
         </Show>
      );
   };
   const DocLayoutSettings = () => {
      const sliders = [
         ['gap', [2, 10]],
         ['size', [4, 48]],
         ['mGridWidth', [5, 100]],
         ['mGridHeight', [10, 550]],
         ['fGridWidth', [32, 150]],
         ['fGridHeight', [10, 550]]
      ] as const;
      return (
         <Show when={selectedDocument()}>
            <For each={/*@once*/sliders}>
               {([p, [min, max]]) => (
                  <div class={s.control}>
                     <span>{p} [{selectedDocument().layoutOptions[p]}]</span>
                     <input
                        disabled={import.meta.env.PROD}
                        title={import.meta.env.PROD ? t('settings.document.prod-non-active') : undefined}
                        type="range"
                        min={min}
                        max={max}
                        value={selectedDocument().layoutOptions[p]}
                        oninput={(e) => {
                           if (import.meta.env.PROD) return;
                           updateDoc('layoutOptions', p, e.currentTarget.valueAsNumber);
                        }}
                     />
                  </div>
               )}
            </For>
            <button
               disabled={import.meta.env.PROD}
               onClick={() => {
                  if (import.meta.env.PROD) return;
                  updateDoc('layoutOptions', defaultLayoutOptions);
               }}>
               {t('settings.document.reset-layout')}
            </button>
         </Show>
      );
   };

   const settingsMap = {
      general: GeneralSettings,
      graphics: GraphicsSettings,
      'doc-layout': DocLayoutSettings,
   };

   return (
      <div class={s.settings}>
         <div class={s.menu}>
            <div class={s.title}>
               {t('settings.system.modal.menu.title')}
            </div>
            <div class={s.blocks}>
               <div class={s.block}>
                  <div class={s.name}>{t('settings.system.modal.menu.general')}</div>
                  <div class={s.items}>
                     <div
                        class={s.item}
                        classList={{ [s.highlighted]: selectedItem() === 'general' }}
                        onClick={() => setSelectedItem('general')}
                     >
                        <LanguageIcon class={s.icon} />
                        <span class={s.text}>
                           {t('settings.system.modal.menu.item.general')}
                        </span>
                     </div>
                     <div
                        class={s.item}
                        classList={{ [s.highlighted]: selectedItem() === 'graphics' }}
                        onClick={() => setSelectedItem('graphics')}
                     >
                        <SettingsIcon class={s.icon} />
                        <span class={s.text}>{t('settings.system.modal.menu.item.graphics')}</span>
                     </div>
                  </div>
               </div>
               <Show when={selectedDocument()}>
                  <div class={s.block}>
                     <div class={s.name}>{t('settings.system.modal.menu.document')} [{selectedDocument().title}]</div>
                     <div class={s.items}>
                        <div
                           class={s.item}
                           classList={{ [s.highlighted]: selectedItem() === 'doc-layout' }}
                           onClick={() => setSelectedItem('doc-layout')}
                        >
                           <LayoutIcon class={s.icon} />
                           <span class={s.text}>{t('settings.system.modal.menu.item.layout')}</span>
                        </div>
                     </div>
                  </div>
               </Show>
            </div>
         </div>
         <div class={s.settingsView}>
            <Dynamic component={settingsMap[selectedItem()]} />
         </div>
      </div>
   );
}
export default Settings;