import { onMount } from 'solid-js';

export function useYandexMetrica() {
   const ymId = 89236688;
   const initYandexMetrica = () => new Promise<void>((res, rej) => {
      let inited = false;
      function insertScript(m, e, t, r, i) {
         m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
         m[i].l = 1 * new Date();
         let k = e.createElement(t);
         let a = e.getElementsByTagName(t)[0];
         k.async = 1;
         k.onerror = rej;
         k.src = r;
         a.parentNode.insertBefore(k, a);
      }
      insertScript(window, document, "script", "https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js", "ym");
      document.addEventListener(`yacounter${ymId}inited`, () => {
         res();
         inited = true;
      });
      ym(ymId, "init", {
         clickmap: true,
         trackLinks: true,
         accurateTrackBounce: true,
         webvisor: true,
         triggerEvent: true,
         trackHash: true
      });
   });

   onMount(() => {
      initYandexMetrica()
         .then(() => console.log('Yandex metrica connected'))
         .catch(() => console.log('Couldn\'t load Yandex metrica'));
   });
}
