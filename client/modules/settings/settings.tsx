
import { createComputed, createSignal, For, Show } from 'solid-js';

import { Dynamic } from 'solid-js/web';

import LanguageIcon from './assets/language.svg';
import LayoutIcon from './assets/layout.svg';
import './settings.scss';

import { getTextBlockSize } from '../bloki-editor/blocks/text/helpers';
import { isTextBlock } from '../bloki-editor/types/blocks';

import SettingsIcon from '@/modules/side-menu/assets/settings.svg';

import { useAppStore } from '@/modules/app.store';

let lastOpenedItem = 'general';
export function Settings() {
   const [app, { setAppStore, selectedDocument }] = useAppStore();
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
            <div class="block">
               <div class="name">{'settings.system.modal.name.title'}</div>
               <div class="nickname">
                  <button
                  // onClick={(e) => {
                  //    if (name.length < 1 || name.length > 15) {
                  //       return alert('Name is too short/long!');
                  //    }
                  //    setAppStore({ name });
                  // }}
                  >
                     {'settings.system.modal.name.save'}
                  </button>
               </div>
            </div>
            <div class="block">
               <div class="name">{'settings.system.modal.menu.item.language'}</div>
               <select name="lang"
                  onChange={(e) => {
                     if (e.currentTarget.selectedIndex === 0) return;
                     // console.log('selected lang', supportedLangs[e.currentTarget.selectedIndex - 1]);
                     // setAppStore('locale', supportedLangs[e.currentTarget.selectedIndex - 1]);
                  }}
               >
                  <option>{'settings.system.modal.language.select-language'}</option>
                  {/* <For each={supportedLangs}>
                  {lang => (<option value={lang} selected={app.locale === lang}>{t(`system.language.${lang}`)}</option>)}
                  {/* </For>  */}
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
            <div class="check">
               <input
                  type="checkbox"
                  name="show-gradient"
                  // onClick={(e) => updateDoc('layoutOptions', 'showGridGradient', e.currentTarget.checked)}
                  checked={selectedDocument().layoutOptions.showGridGradient}
               />
               <label for="show-gradient">{'settings.document.grid-gradient'}</label>
            </div>
            <div class="check">
               <input
                  type="checkbox"
                  name="show-resizers"
                  // onClick={(e) => updateDoc('layoutOptions', 'showResizeAreas', e.currentTarget.checked)}
                  checked={selectedDocument().layoutOptions.showResizeAreas}
               />
               <label for="show-resizers">{'settings.document.resize-areas'}</label>
            </div>
            <div class="gridType">
               <div>
                  {"settings.system.render-method.title"}
               </div>
               <div class="methods">
                  {(['canvas', 'dom'] as const).map((type) => (
                     <div>
                        <input
                           type="radio"
                           id={type + 'method'}
                           checked={app.gridRenderMethod === type}
                        // onInput={() => setAppStore({ gridRenderMethod: type })}
                        />
                        <label for={type + 'method'}>{`settings.system.render-method.${type}`}</label>
                     </div>
                  ))}
               </div>
            </div>
            <button
               onClick={logCalculatedSizes}
            >
               {'settings.document.log-calculated-sizes'}
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
                  <div class="control">
                     <span>{p} [{selectedDocument().layoutOptions[p]}]</span>
                     <input
                        disabled={import.meta.env.PROD}
                        title={import.meta.env.PROD ? 'settings.document.prod-non-active' : undefined}
                        type="range"
                        min={min}
                        max={max}
                        value={selectedDocument().layoutOptions[p]}
                        oninput={(e) => {
                           if (import.meta.env.PROD) return;
                           // updateDoc('layoutOptions', p, e.currentTarget.valueAsNumber);
                        }}
                     />
                  </div>
               )}
            </For>
            <button
               disabled={import.meta.env.PROD}
               onClick={() => {
                  if (import.meta.env.PROD) return;
                  // updateDoc('layoutOptions', defaultLayoutOptions);
               }}>
               {'settings.document.reset-layout'}
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
      <div class="settings">
         <div class="menu">
            <div class="title">
               {'settings.system.modal.menu.title'}
            </div>
            <div class="blocks">
               <div class="block">
                  <div class="name">{'settings.system.modal.menu.general'}</div>
                  <div class="items">
                     <div
                        class="item"
                        classList={{ 'highlighted': selectedItem() === 'general' }}
                        onClick={() => setSelectedItem('general')}
                     >
                        <LanguageIcon class="icon" />
                        <span class="text">
                           {'settings.system.modal.menu.item.general'}
                        </span>
                     </div>
                     <div
                        class="item"
                        classList={{ 'highlighted': selectedItem() === 'graphics' }}
                        onClick={() => setSelectedItem('graphics')}
                     >
                        <SettingsIcon class="icon" />
                        <span class="text">{'settings.system.modal.menu.item.graphics'}</span>
                     </div>
                  </div>
               </div>
               <Show when={selectedDocument()}>
                  <div class="block">
                     <div class="name">{'settings.system.modal.menu.document'} [{selectedDocument().title}]</div>
                     <div class="items">
                        <div
                           class="item"
                           classList={{ 'highlighted': selectedItem() === 'doc-layout' }}
                           onClick={() => setSelectedItem('doc-layout')}
                        >
                           <LayoutIcon class="icon" />
                           <span class="text">{'settings.system.modal.menu.item.layout'}</span>
                        </div>
                     </div>
                  </div>
               </Show>
            </div>
         </div>
         <div class="settingsView">
            <Dynamic component={settingsMap[selectedItem()]} />
         </div>
      </div>
   );
}
export default Settings;
