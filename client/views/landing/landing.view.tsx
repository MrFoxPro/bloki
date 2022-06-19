import './landing.scss';

import PresentationGif from './assets/presentation1.gif';
import FileStructureImage from './assets/file-structure.webp';
import WorkspacesImage from './assets/workspaces.webp';
import TeamWorkImage from './assets/teams.webp';
import LibImage from './assets/libraries.webp';
import LogoIcon from '@/assets/images/logo-orange.svg';
import LogoDarkIcon from '@/assets/images/logo-dark.svg';
import GithubIcon from '@/assets/images/github-logo.svg';
import UnderLine1 from './assets/underline-1.svg';
import UnderLine2 from './assets/underline-2.svg';
import UnderLine3 from './assets/underline-3.svg';
import { langs } from '@/modules/i18n/i18n.module';
import { For, onCleanup } from 'solid-js';
import { useYandexMetrica } from '@/lib/ym';
import { useNavigate } from 'solid-app-router';


export function LandingView() {
   useYandexMetrica();

   const navigate = useNavigate();

   function animatedash(el: HTMLElement, delay?: () => number) {
      const observer = new IntersectionObserver((e) => {
         if (e.length && e[0].isIntersecting) {
            if (typeof delay() === 'number') {
               setTimeout(() => {
                  el.style.strokeDashoffset = '0';
                  observer.disconnect();
               }, delay());
               return;
            }
            el.style.strokeDashoffset = '0';
            observer.disconnect();
         }
      });
      observer.observe(el);
      onCleanup(() => observer.disconnect());
   };

   return (
      <div class='page landing'>
         <div class='page-content'>
            <div class='page-header'>
               <LogoIcon class='logo' />
               <div class='items-container'>
                  <a class='login' onClick={() => navigate('/welcome')}>{t().login}</a>
                  <button class='button try' onClick={() => navigate('/docs')}>{t().try}</button>
               </div>
            </div>
         </div>
         <hr />
         <div class='page-content'>
            <section>
               <div class='intro'>
                  {t().intro}
                  <svg class="text-mark intro__place-word" width="249" height="110" viewBox="0 0 249 110" fill="none" use:animatedash>
                     <path d="M176.426 7.38803C144.791 4.02688 111.901 2.11459 80.1389 5.52987C58.923 7.81115 30.8167 15.7916 15.8351 32.3888C9.41106 39.5057 4.40987 47.9388 3.33475 57.6148C1.89728 70.5521 8.9232 76.6854 19.3825 83.2913C44.7162 99.2915 73.0914 104.82 102.775 106.152C120.976 106.969 139.211 106.51 157.225 103.562C165.213 102.255 173.034 100.195 180.987 98.7197C191.063 96.8498 201.331 96.4283 211.337 94.1024C225.395 90.8344 248.928 81.4747 244.671 62.5136C240.147 42.3622 216.913 30.97 199.287 24.3931C184.361 18.8238 169.949 12.2289 154.128 9.52774C141.223 7.32452 127.648 8.40158 114.599 8.40158" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                  </svg>
                  <svg class='text-mark intro__all-word' width="188" height="31" viewBox="0 0 188 31" fill="none" use:animatedash={800}>
                     <path class='text-mark' use:animatedash d="M3.7793 4.5004C39.9746 1.38683 76.9188 4.31257 113.13 5.06348C134.015 5.49659 154.885 5.91636 175.744 7.09057C176.869 7.15387 183.216 6.60635 184.19 8.55458" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     <path class='text-mark' use:animatedash={250} d="M19.9961 15.6504C54.3509 19.3149 88.9357 21.6831 123.321 25.2228C132.91 26.2099 142.447 25.4855 151.757 27.8129" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                  </svg>

               </div>
               <img class='interactive' src={PresentationGif} />
            </section>

            <section class='feature'>
               <img class='demo' src={FileStructureImage} />
               <div class='text'>
                  <div class='heading'>
                     {t().fs.heading}
                     <svg class='text-mark fs__structure-word' width="394" height="85" viewBox="0 0 394 85" fill="none" use:animatedash>
                        <path d="M44.1712 12.7224C88.0807 4.55315 133.369 3.73438 177.867 3.73438C233.643 3.73438 291.381 4.04212 346.33 15.0318C354.999 16.7656 363.524 19.2732 371.858 22.2097C376.961 24.0075 385.842 25.9038 389.085 30.948C393.037 37.0949 389.319 47.2077 384.217 51.171C372.491 60.2782 355.712 70.1513 341.212 73.204C328.434 75.894 315.112 76.2162 302.139 77.3859C284.87 78.9429 267.572 81.1309 250.208 81.1309C203.104 81.1309 155.82 75.5933 108.835 72.8295C77.2815 70.9734 46.4118 66.4302 15.8341 58.7858C12.1229 57.858 1.79965 55.6883 4.34945 49.8602C7.75996 42.0647 14.0241 36.9055 21.7637 33.5695C35.6257 27.5945 51.916 24.2681 66.6412 20.5868" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     </svg>
                  </div>
                  <div class='description'>{t().fs.description}</div>
               </div>
            </section>

            <section class='feature'>
               <img class='demo' src={WorkspacesImage} />
               <div class='text'>
                  <div class='heading'>
                     <svg class='text-mark workspaces__workspaces-word' width="403" height="38" viewBox="0 0 403 38" fill="none" >
                        <path class='text-mark' use:animatedash d="M11.6621 7.06728C90.8911 7.06728 169.824 5.3809 249.077 7.75172C299.283 9.25361 349.757 9.54087 399.739 3.9873" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                        <path class='text-mark' use:animatedash={350} d="M3.0957 19.5205C14.903 21.3848 27.123 20.9572 39.0321 21.98C57.1271 23.5342 75.2833 24.6303 93.4148 25.6693C132.346 27.9004 171.352 28.5288 210.276 30.8958C231.387 32.1796 252.483 34.2182 273.643 34.2776C293.388 34.3331 313.175 34.5831 332.911 33.9702C353.505 33.3306 374.168 33.0479 394.775 33.0479" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     </svg>
                     {t().workspaces.heading}
                  </div>
                  <div class='description'>{t().workspaces.description}</div>
               </div>
            </section>

            <section class='feature'>
               <img class='demo' src={TeamWorkImage} />
               <div class='text'>
                  <div class='heading'>
                     {t().teamwork.heading}
                     <svg class='text-mark teams__team-word' use:animatedash width="334" height="105" viewBox="0 0 334 105" fill="none" >
                        <path d="M19.0377 27.516C68.3189 7.91553 118.374 8.57568 170.62 8.76848C212.805 8.92414 264.269 4.20596 301.693 27.5961C308.993 32.1584 314.723 39.1679 321.162 44.8215C328.474 51.2424 331.863 53.7091 329.093 63.2485C326.353 72.6857 321.111 76.6289 311.948 79.7528C301.098 83.4516 289.802 85.394 278.619 87.7646C267.191 90.1871 256.472 94.3552 245.21 97.2986C224.699 102.659 202.383 101.479 181.356 100.984C153.214 100.322 124.842 95.4782 96.9922 91.6102C70.33 87.9071 24.1979 85.6784 9.26333 57.8005C2.13605 44.4963 -1.37869 28.6531 12.468 19.1037C28.7467 7.87701 53.5 6.54302 72.3961 3" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     </svg>
                  </div>
                  <div class='description'>{t().teamwork.description}</div>
               </div>
            </section>

            <section class='feature'>
               <img class='demo' src={LibImage} />
               <div class='text'>
                  <div class='heading'>
                     {t().lib.heading}
                     <svg class='text-mark libs__libraries-word' width="371" height="31" viewBox="0 0 371 31" fill="none" >
                        <path class='text-mark' use:animatedash d="M8.49023 13.1729C12.7349 12.7013 16.9181 12.6535 21.1883 12.6535C39.0941 12.6535 56.9912 12.2688 74.8953 12.1629C121.575 11.8867 168.211 12.6541 214.863 10.5756C252.3 8.90761 289.541 4.83676 326.981 3.30308C339.563 2.78765 352.691 3.82255 364.844 3.82255" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                        <path class='text-mark' use:animatedash={320} d="M3.29688 27.7186C27.632 27.7186 51.9336 26.4486 76.253 25.6407C116.463 24.3048 156.679 23.4754 196.885 22.0044C236.092 20.57 275.092 22.0044 314.284 22.0044C326.405 22.0044 338.454 21.47 350.531 20.446C356.358 19.9519 362.258 19.6844 367.962 18.3682" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     </svg>
                  </div>
                  <div class='description'>{t().lib.description}</div>
               </div>
            </section>

            <section class='outro'>
               <div class='start'>
                  {t().outro[0]}
                  <svg class='text-mark smile' width="62" height="57" viewBox="0 0 62 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path class='text-mark' use:animatedash={800} d="M13.7129 3C15.1984 7.64236 16.3057 12.4269 17.8338 17.011" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     <path class='text-mark' use:animatedash={950} d="M32.6699 4.64844C33.3539 8.44837 33.9437 12.5908 35.1424 16.1869" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                     <path class='text-mark' use:animatedash={1100} d="M3 41.7357C7.54615 45.2122 11.433 48.2118 17.1484 49.5654C24.2904 51.2569 39.4402 55.9261 45.9029 50.7559C51.0262 46.6572 54.528 42.6519 57.2125 36.5159C57.6626 35.487 58.9473 30.1973 58.2198 30.1973" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                  </svg>
               </div>
               <br />
               <div class='end'>
                  {t().outro[1]}
                  <svg width="450" height="15" viewBox="0 0 450 15" fill="none" class='text-mark templates-and-plugins' use:animatedash={350}>
                     <path d="M3.0918 11.1786C26.986 6.27725 51.4959 7.98764 75.7752 7.98764C137.914 7.98764 199.975 7.54926 262.093 5.68305C323.572 3.83604 385.13 3.20117 446.638 3.20117" stroke="#FFA61F" stroke-width="6" stroke-linecap="round" />
                  </svg>
               </div>
            </section>
         </div>
         <hr />
         <footer>
            <div class='brands'>
               <LogoDarkIcon />
               <a href='https://github.com/MrFoxPro/bloki' target='_blank'>
                  <GithubIcon />
               </a>
            </div>
            <div class='navs'>
               <For each={[
                  [t().footer.about, ['Пример'], UnderLine1],
                  [t().footer.product, ['Роадмап'], UnderLine2],
                  [t().footer.contacts, ['Пример'], UnderLine3],
               ] as const}>{
                     ([header, items, underline]) => (
                        <nav>
                           <h4>{header}{underline}</h4>
                           <ul>
                              <For each={items}>{
                                 (item) => (
                                    <li>
                                       <a>{item}</a>
                                    </li>
                                 )
                              }</For>
                           </ul>
                        </nav>
                     )}
               </For>
            </div>
         </footer >
      </div >
   );
}

export default LandingView;

const t = langs({
   ru: {
      login: 'Войти',
      try: 'Попробовать',
      intro: 'Одно место для всех ваших задач',
      fs: {
         heading: 'Файловая структура',
         description: 'В блоки вы можете создать уникальную структуру из файлов, которая поможет вам организовать любую задачу в удобном виде'
      },
      workspaces: {
         heading: 'Рабочие пространства',
         description: 'Создавайте неограниченное колличество разных воркспейсовдля разных задач. Будь то занятие математикой, заметки по работе, идеи по новому проекту'
      },
      teamwork: {
         heading: 'Команда',
         description: 'Приглашайте в воркспейсы неогранниченное количество людей и создавайте вместе'
      },
      lib: {
         heading: 'Библиотеки',
         description: 'Вы всегда можете обратиться к готовым библиотекам либо загрузить свои материалы и использовать их'
      },
      outro: {
         0: 'А ещё у нас есть',
         1: 'Шаблоны и плагины'
      },
      footer: {
         about: 'О нас',
         product: 'Продукт',
         contacts: 'Контакты'
      }
   },
   en: {
      login: 'Login',
      try: 'Try it',
      intro: 'One place for all your tasks',
      fs: {
         heading: 'File hierarchy',
         description: 'В блоки вы можете создать уникальную структуру из файлов, которая поможет вам организовать любую задачу в удобном виде'
      },
      workspaces: {
         heading: 'Рабочие пространства',
         description: 'Создавайте неограниченное колличество разных воркспейсовдля разных задач. Будь то занятие математикой ,заметки по работе,идеи по новому проекту'
      },
      teamwork: {
         heading: 'Команда',
         description: 'Приглашайте в воркспейсы неогранниченное количество людей и создавайте вместе'
      },
      lib: {
         heading: 'Библиотеки',
         description: 'Вы всегда можете обратиться к готовым библиотекам либо загрузить свои материалы и использовать их'
      },
      outro: {
         0: 'А ещё у нас есть',
         1: 'Шаблоны и плагины'
      },
      footer: {
         about: 'About',
         product: 'Product',
         contacts: 'Контакты'
      }
   }
});
