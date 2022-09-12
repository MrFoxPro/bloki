import './landing.scss'
import { For, lazy, onCleanup, Suspense } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { useNavigate } from '@solidjs/router'
import { Loader } from '@/components/loader/loader'
import { langs } from '@/modules/i18n/i18n.module'
import { useYandexMetrica } from '@/lib/ym'
import { Theme, useThemeContext } from '@/modules/theme.store'
const BlokiEditor = lazy(() => import('@/modules/editor/editor'))
import { landingDoc } from '@/lib/samples'

import FileStructureImage from './assets/fs.webp'

import WorkspacesImageAV1 from './assets/workspaces.av1.mp4'
import CursorsImageAV1 from './assets/cursors.av1.mp4'
import LibImageAV1 from './assets/libs.av1.mp4'

import WorkspacesImageVP9 from './assets/workspaces.vp9.webm'
import CursorsImageVP9 from './assets/cursors.vp9.webm'
import LibImageVP9 from './assets/libs.vp9.webm'

import LogoIcon from '@/assets/img/logo-orange.svg'
import GithubIcon from '@/assets/img/github.svg'
import UnderLine1 from './assets/underline-1.svg'
import UnderLine2 from './assets/underline-2.svg'
import UnderLine3 from './assets/underline-3.svg'
import SunIcon from './assets/sun.svg'
import MoonIcon from './assets/moon.svg'
import BricksIcon from './assets/bricks.svg'
import { Repeat } from '@solid-primitives/range'
import { AppPath } from '../router'

declare module 'solid-js' {
   namespace JSX {
      interface Directives {
         animatedash: boolean | number
      }
   }
}
export function animatedash(el: HTMLElement, delay?: () => number) {
   const observer = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting) {
         if (typeof delay() === 'number') {
            setTimeout(() => {
               el.style.strokeDashoffset = '0'
               observer.disconnect()
            }, delay())
            return
         }
         el.style.strokeDashoffset = '0'
         observer.disconnect()
      }
   })
   // https://bugs.chromium.org/p/chromium/issues/detail?id=963246
   let toObserve = el.tagName !== 'svg' ? el.closest('svg') : el
   observer.observe(toObserve)
   onCleanup(() => observer.disconnect())
}

export function LandingView() {
   if (import.meta.env.PROD) {
      useYandexMetrica()
   }
   const navigate = useNavigate()
   const { theme, setTheme } = useThemeContext()

   const WindowControls = [
      ['#FC5753', '#DF4744'],
      ['#FDBC40', '#DE9F34'],
      ['#36C84B', '#27AA35'],
   ].map(([fill, border]) => (
      <div
         class="btn"
         style={{
            'background-color': fill,
            'border-color': border,
         }}
      />
   ))
   const FOOTER_ITEMS = [
      [t().footer.about, [{ text: 'Source', a: 'https://github.com/MrFoxPro/bloki' }], UnderLine1],
      [t().footer.product, [], UnderLine2],
      [t().footer.contacts, [], UnderLine3],
   ] as const

   return (
      <div class="page landing">
         <div class="bricks-group">
            <Repeat times={3}>
               <BricksIcon class="bricks" />
            </Repeat>
         </div>
         <div class="lines">
            <svg class="line" width="1158" height="734" viewBox="0 0 1158 734" fill="none">
               <defs>
                  <path id="path1" d="M1028.5 2C1200 42 1291.6 327.5 664 449.5C36.4 571.5 9 676 2 732" />
                  <mask id="mask1">
                     <use class="mask" href="#path1" use:animatedash={500} />
                  </mask>
               </defs>
               <use
                  class="paths"
                  href="#path1"
                  style={{
                     mask: 'url(#mask1)',
                  }}
               />
            </svg>
            <svg class="line" width="1033" height="543" viewBox="0 0 1033 543" fill="none">
               <defs>
                  <path id="path2" d="M6.50099,2C-28.0005,83.5 174,212.02 588.608,267.5C870.855,305.268 1030.11,379.5 1030.11,540.5" />
                  <mask id="mask2">
                     <use class="mask" href="#path2" use:animatedash={500} />
                  </mask>
               </defs>
               <use
                  class="paths"
                  href="#path2"
                  style={{
                     mask: 'url(#mask2)',
                  }}
               />
            </svg>
            <svg class="line" width="1152" height="657" viewBox="0 0 1152 657" fill="none">
               <defs>
                  <path id="path3" d="M1083 2C1209.48 84.4521 1208.59 296.927 581.071 390.5C78.5 465.442 2.57297 566.5 2.57227 655" />
                  <mask id="mask3">
                     <use class="mask" href="#path3" use:animatedash={500} />
                  </mask>
               </defs>
               <use
                  class="paths"
                  href="#path3"
                  style={{
                     mask: 'url(#mask3)',
                  }}
               />
            </svg>
         </div>
         <header class="page-header">
            <LogoIcon class="logo" id="logo" />
            <div class="items-container">
               <Dynamic
                  component={{ light: MoonIcon, dark: SunIcon }[theme()]}
                  class="change-theme"
                  onClick={[setTheme, (t) => (t === Theme.Dark ? Theme.Light : Theme.Dark)]}
               />
               <a class="login" onClick={[navigate, AppPath.Welcome]}>
                  {t().login}
               </a>
               <button class="try primary" onClick={[navigate, AppPath.Playground]}>
                  {t().try}
               </button>
            </div>
         </header>
         <section>
            <div class="intro">
               <div>{t().intro[0]}</div>
               <div>{t().intro[1]}</div>
               <svg class="decoration place" width="100%" height="65" viewBox="0 0 169 75" fill="none">
                  <path
                     class="mark"
                     use:animatedash
                     d="M119.697 5.46326C98.3923 3.19962 76.2417 1.91175 54.8509 4.21184C40.5625 5.74822 21.6338 11.1228 11.5441 22.3006C7.21769 27.0936 3.84954 32.773 3.12548 39.2895C2.15738 48.0024 6.88914 52.133 13.9332 56.5819C30.9947 67.3576 50.1046 71.0811 70.0954 71.9781C82.3531 72.5282 94.6341 72.2189 106.766 70.2337C112.146 69.3534 117.413 67.9663 122.769 66.9725C129.555 65.7131 136.47 65.4293 143.209 63.8629C152.677 61.662 168.525 55.3585 165.658 42.5887C162.612 29.0174 146.964 21.345 135.093 16.9157C125.041 13.1649 115.335 8.72345 104.68 6.90429C95.9893 5.42049 86.8468 6.14586 78.059 6.14586"
                  />
               </svg>
               <svg class="decoration all" width="100%" height="31" viewBox="0 0 188 31" fill="none">
                  <path
                     class="mark"
                     use:animatedash
                     d="M3.7793 4.5004C39.9746 1.38683 76.9188 4.31257 113.13 5.06348C134.015 5.49659 154.885 5.91636 175.744 7.09057C176.869 7.15387 183.216 6.60635 184.19 8.55458"
                  />
                  <path
                     class="mark"
                     use:animatedash={250}
                     d="M19.9961 15.6504C54.3509 19.3149 88.9357 21.6831 123.321 25.2228C132.91 26.2099 142.447 25.4855 151.757 27.8129"
                  />
               </svg>
            </div>
            <div class="interactive">
               <Suspense fallback={<Loader size="medium" center />}>
                  <BlokiEditor document={landingDoc} />
               </Suspense>
            </div>
         </section>
         <section class="feature">
            <div class="window">
               {WindowControls}
               <img class="demo" src={FileStructureImage} />
            </div>
            <div class="text">
               <div class="heading">
                  <div>{t().fs.heading}</div>
                  <svg class="decoration structure" width="100%" height="85" viewBox="0 0 394 85" fill="none">
                     <path
                        class="mark"
                        use:animatedash
                        d="M44.1712 12.7224C88.0807 4.55315 133.369 3.73438 177.867 3.73438C233.643 3.73438 291.381 4.04212 346.33 15.0318C354.999 16.7656 363.524 19.2732 371.858 22.2097C376.961 24.0075 385.842 25.9038 389.085 30.948C393.037 37.0949 389.319 47.2077 384.217 51.171C372.491 60.2782 355.712 70.1513 341.212 73.204C328.434 75.894 315.112 76.2162 302.139 77.3859C284.87 78.9429 267.572 81.1309 250.208 81.1309C203.104 81.1309 155.82 75.5933 108.835 72.8295C77.2815 70.9734 46.4118 66.4302 15.8341 58.7858C12.1229 57.858 1.79965 55.6883 4.34945 49.8602C7.75996 42.0647 14.0241 36.9055 21.7637 33.5695C35.6257 27.5945 51.916 24.2681 66.6412 20.5868"
                     />
                  </svg>
               </div>
               <div class="description">{t().fs.description}</div>
            </div>
         </section>
         <section class="feature">
            <div class="window">
               {WindowControls}
               <video class="demo" autoplay muted loop playsinline>
                  <source src={WorkspacesImageVP9} type="video/webm; codecs=vp8, vorbis" />
                  <source src={WorkspacesImageAV1} type="video/mp4; codecs=av01.0.05M.08,opus" />
               </video>
            </div>
            <div class="text">
               <div class="heading">
                  <svg class="decoration workspaces" width="100%" height="38" viewBox="0 0 403 38" fill="none">
                     <path
                        class="mark"
                        use:animatedash
                        d="M11.6621 7.06728C90.8911 7.06728 169.824 5.3809 249.077 7.75172C299.283 9.25361 349.757 9.54087 399.739 3.9873"
                     />
                     <path
                        class="mark"
                        use:animatedash={350}
                        d="M3.0957 19.5205C14.903 21.3848 27.123 20.9572 39.0321 21.98C57.1271 23.5342 75.2833 24.6303 93.4148 25.6693C132.346 27.9004 171.352 28.5288 210.276 30.8958C231.387 32.1796 252.483 34.2182 273.643 34.2776C293.388 34.3331 313.175 34.5831 332.911 33.9702C353.505 33.3306 374.168 33.0479 394.775 33.0479"
                     />
                  </svg>
                  {t().workspaces.heading}
               </div>
               <div class="description">{t().workspaces.description}</div>
            </div>
         </section>
         <section class="feature">
            <div class="window">
               {WindowControls}
               <video class="demo" controls={false} loop muted autoplay playsinline>
                  <source src={CursorsImageAV1} type="video/mp4; codecs=av01.0.05M.08,opus" />
                  <source src={CursorsImageVP9} type="video/webm; codecs=vp8, vorbis" />
               </video>
            </div>
            <div class="text">
               <div class="heading">
                  <div>{t().teamwork.heading}</div>
                  <svg class="decoration collaboration" width="100%" height="105" viewBox="0 0 334 105" fill="none">
                     <path
                        class="mark"
                        use:animatedash
                        d="M19.0377 27.516C68.3189 7.91553 118.374 8.57568 170.62 8.76848C212.805 8.92414 264.269 4.20596 301.693 27.5961C308.993 32.1584 314.723 39.1679 321.162 44.8215C328.474 51.2424 331.863 53.7091 329.093 63.2485C326.353 72.6857 321.111 76.6289 311.948 79.7528C301.098 83.4516 289.802 85.394 278.619 87.7646C267.191 90.1871 256.472 94.3552 245.21 97.2986C224.699 102.659 202.383 101.479 181.356 100.984C153.214 100.322 124.842 95.4782 96.9922 91.6102C70.33 87.9071 24.1979 85.6784 9.26333 57.8005C2.13605 44.4963 -1.37869 28.6531 12.468 19.1037C28.7467 7.87701 53.5 6.54302 72.3961 3"
                     />
                  </svg>
               </div>
               <div class="description">{t().teamwork.description}</div>
            </div>
         </section>
         <section class="feature">
            <div class="window">
               {WindowControls}
               <video class="demo" autoplay muted loop playsinline>
                  <source src={LibImageAV1} type="video/mp4; codecs=av01.0.05M.08,opus" />
                  <source src={LibImageVP9} type="video/webm; codecs=vp8, vorbis" />
               </video>
            </div>
            <div class="text">
               <div class="heading">
                  <div> {t().lib.heading}</div>
                  <svg class="decoration lib" width="100%" height="31" viewBox="0 0 371 31" fill="none">
                     <path
                        class="mark"
                        use:animatedash
                        d="M8.49023 13.1729C12.7349 12.7013 16.9181 12.6535 21.1883 12.6535C39.0941 12.6535 56.9912 12.2688 74.8953 12.1629C121.575 11.8867 168.211 12.6541 214.863 10.5756C252.3 8.90761 289.541 4.83676 326.981 3.30308C339.563 2.78765 352.691 3.82255 364.844 3.82255"
                     />
                     <path
                        class="mark"
                        use:animatedash={320}
                        d="M3.29688 27.7186C27.632 27.7186 51.9336 26.4486 76.253 25.6407C116.463 24.3048 156.679 23.4754 196.885 22.0044C236.092 20.57 275.092 22.0044 314.284 22.0044C326.405 22.0044 338.454 21.47 350.531 20.446C356.358 19.9519 362.258 19.6844 367.962 18.3682"
                     />
                  </svg>
               </div>
               <div class="description">{t().lib.description}</div>
            </div>
         </section>
         <section class="outro">
            <div class="start">
               <div>{t().outro[0]}</div>
            </div>
            <div class="end">
               <a href="/demo">{t().outro[1]}</a>
               <svg class="decoration smile" width="62" height="57" viewBox="0 0 62 57" fill="none">
                  <path class="mark" use:animatedash={800} d="M13.7129 3C15.1984 7.64236 16.3057 12.4269 17.8338 17.011" />
                  <path class="mark" use:animatedash={950} d="M32.6699 4.64844C33.3539 8.44837 33.9437 12.5908 35.1424 16.1869" />
                  <path
                     class="mark"
                     use:animatedash={1100}
                     d="M3 41.7357C7.54615 45.2122 11.433 48.2118 17.1484 49.5654C24.2904 51.2569 39.4402 55.9261 45.9029 50.7559C51.0262 46.6572 54.528 42.6519 57.2125 36.5159C57.6626 35.487 58.9473 30.1973 58.2198 30.1973"
                  />
               </svg>
               <svg class="decoration create-account" width="100%" height="15" viewBox="0 0 450 15" fill="none">
                  <path
                     class="mark"
                     use:animatedash={350}
                     d="M3.0918 11.1786C26.986 6.27725 51.4959 7.98764 75.7752 7.98764C137.914 7.98764 199.975 7.54926 262.093 5.68305C323.572 3.83604 385.13 3.20117 446.638 3.20117"
                  />
               </svg>
            </div>
         </section>
         <footer>
            <div class="navs">
               <For each={FOOTER_ITEMS}>
                  {([header, items, underline]) => (
                     <nav>
                        <h4>
                           {header}
                           {underline({})}
                        </h4>
                        <ul>
                           <For each={items}>
                              {(item) => (
                                 <li>
                                    <GithubIcon />
                                    <a href={item.a} target="_blank">
                                       {item.text}
                                    </a>
                                 </li>
                              )}
                           </For>
                        </ul>
                     </nav>
                  )}
               </For>
            </div>
            <hr />
            <div class="cc">© Bloki {new Date().getFullYear()}</div>
         </footer>
      </div>
   )
}

export default LandingView

const t = langs({
   ru: {
      login: 'Войти',
      try: 'Попробовать',
      intro: { 0: 'One place for', 1: 'all your tasks' },
      fs: {
         heading: 'Файловая структура',
         description:
            'В блоки вы можете создать уникальную структуру из файлов, которая поможет вам организовать любую задачу в удобном виде',
      },
      workspaces: {
         heading: 'Рабочие пространства',
         description:
            'Создавайте неограниченное колличество разных воркспейсовдля разных задач. Будь то занятие математикой, заметки по работе, идеи по новому проекту',
      },
      teamwork: {
         heading: 'Команда',
         description: 'Приглашайте в воркспейсы неогранниченное количество людей и создавайте вместе',
      },
      lib: {
         heading: 'Библиотеки',
         description: 'Вы всегда можете обратиться к готовым библиотекам либо загрузить свои материалы и использовать их',
      },
      outro: {
         0: 'А ещё у нас есть',
         1: 'Шаблоны и плагины',
      },
      footer: {
         about: 'О нас',
         product: 'Продукт',
         contacts: 'Контакты',
      },
   },
   en: {
      login: 'Login',
      try: 'Try it',
      intro: { 0: 'One place for', 1: 'all your tasks' },
      fs: {
         heading: 'File structure',
         description:
            'In bloki you can create a unique structure from the files, which will help you organize any task in a convenient way',
      },
      workspaces: {
         heading: 'Workspaces',
         description:
            "Create an unlimited number of different workspaces for different tasks. Whether it's a math class, notes from work, ideas for a new project",
      },
      teamwork: {
         heading: 'Collaboration',
         description: 'Invite an unlimited number of people to workspaces and create together',
      },
      lib: {
         heading: 'Libraries',
         description: 'You can always consult ready-made libraries or upload your own materials and use them',
      },
      outro: {
         0: 'Try it now',
         1: 'Create an account',
      },
      footer: {
         about: 'About',
         product: 'Product',
         contacts: 'Contact',
      },
   },
})
