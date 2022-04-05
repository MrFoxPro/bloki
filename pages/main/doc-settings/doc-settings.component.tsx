import s from './doc-settings.module.scss';
import { createSignal, For, Show } from 'solid-js';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import { defaultLayoutOptions } from '@/lib/test-data/layout-options';
import { getTextBlockSize } from '@/components/bloki-editor/blocks/text/helpers';
import { isTextBlock } from '@/components/bloki-editor/types/blocks';
import { useEditorStore } from '@/components/bloki-editor/editor.store';
import TripleDotsIcon from '@/components/side-menu/assets/triple-dots.icon.svg';
import IntroBg from './intro.png';

export function DocumentSettings() {
   const [t] = useI18n();
   const [app, { setAppStore }] = useAppStore();
   const [editor, { setEditorStore }] = useEditorStore();

   const [showDocSettings, setShowDocSettings] = createSignal(false);

   function logCalculatedSizes() {
      app.selectedDocument.blocks.forEach(block => {
         if (isTextBlock(block)) {
            getTextBlockSize(block.type, block.fontFamily, block.value, app.selectedDocument.layoutOptions);
         }
      });
   }

   return (
      <>
         <TripleDotsIcon class={s.optionsIcon} onClick={() => setShowDocSettings(s => !s)} />
         <Show when={app.selectedDocument && showDocSettings()}>
            <div class={s.settings}>
               <div class={s.control}>
                  <For each={[
                     ['gap', [2, 10]],
                     ['size', [4, 48]],
                     ['mGridWidth', [5, 100]],
                     ['mGridHeight', [10, 550]],
                     ['fGridWidth', [32, 150]],
                     ['fGridHeight', [10, 550]]
                  ] as const}>
                     {([p, [min, max]]) => (
                        <div class={s.control}>
                           <span>{p} [{app.selectedDocument.layoutOptions[p]}]</span>
                           <input
                              disabled={import.meta.env.PROD}
                              title={import.meta.env.PROD ? t('settings.document.prod-non-active') : undefined}
                              type="range"
                              min={min}
                              max={max}
                              value={app.selectedDocument.layoutOptions[p]}
                              oninput={(e) => {
                                 if (import.meta.env.PROD) return;
                                 setAppStore('selectedDocument', 'layoutOptions', p, e.currentTarget.valueAsNumber);
                              }}
                           />
                        </div>
                     )}
                  </For>
                  <div class={s.check}>
                     <input
                        type="checkbox"
                        name="show-gradient"
                        onClick={(e) => setAppStore('selectedDocument', 'layoutOptions', 'showGridGradient', e.currentTarget.checked)}
                        checked={app.selectedDocument.layoutOptions.showGridGradient} />
                     <label for="show-gradient">{t('settings.document.grid-gradient')}</label>
                  </div>
                  <div class={s.check}>
                     <input
                        type="checkbox"
                        name="show-resizers"
                        onClick={(e) => setAppStore('selectedDocument', 'layoutOptions', 'showResizeAreas', e.currentTarget.checked)}
                        checked={app.selectedDocument.layoutOptions.showResizeAreas} />
                     <label for="show-resizers">{t('settings.document.resize-areas')}</label>
                  </div>
                  <div class={s.check}>
                     <input
                        type="checkbox"
                        name="show-bg"
                        onClick={() => setEditorStore('tempBg', bg => bg ? null : IntroBg)}
                        checked={!!editor.tempBg}
                     />
                     <label for="show-bg">ИНТРО</label>
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
                     disabled={import.meta.env.PROD}
                     onClick={() => {
                        if (import.meta.env.PROD) return;
                        setAppStore('selectedDocument', 'layoutOptions', defaultLayoutOptions);
                     }}>
                     {t('settings.document.reset-layout')}
                  </button>
                  <button
                     style={{
                        color: 'red'
                     }}
                     onClick={() => app.apiProvider.clearCache().then(() => location.reload())}
                  >
                     {t('settings.document.purge-db')}
                  </button>
                  <button
                     onClick={logCalculatedSizes}
                  >
                     {t('settings.document.log-calculated-sizes')}
                  </button>
               </div>
            </div>
         </Show>
      </>
   );
}
export default DocumentSettings;