import { css } from "@linaria/core";
import { sizes, colors } from "@/styles";

import BlokiLogo from "@/assets/img/logo-dark.svg?component-solid";
import Squares from "./assets/squares.svg?component-solid";
import BlokiPreview from "./assets/preview.jpg";
import FileStructureImage from "./assets/fs.webp";

import WorkspacesImageAV1 from "./assets/workspaces.av1.mp4";
import CursorsImageAV1 from "./assets/cursors.av1.mp4";
import LibImageAV1 from "./assets/libs.av1.mp4";

import WorkspacesImageVP9 from "./assets/workspaces.vp9.webm";
import CursorsImageVP9 from "./assets/cursors.vp9.webm";
import LibImageVP9 from "./assets/libs.vp9.webm";

export function Page() {
  return (
    <>
      <section
        class={css`
          background: orange;
          overflow-y: visible; overflow-x: clip;
        `}
      >
        <div
          class={css`
            display: flow-root;
            position: relative;
            margin-inline: auto; max-width: 1440px;
          `}
        >
          <header
            class={css`
              padding: 14px 80px 0 80px;
              width: 100%; max-width: 1440px;
              display: flex; justify-content: space-between; align-items: center; gap: 54px;
              color: var(--color-grey-900); font-weight: 600; font-size: 14px;
              @media (max-width: 1440px) { flex-direction: column; align-items: stretch; }
            `}
          >
            <a href='/'>
              <BlokiLogo
                class={css`
                  width: 100px;
                `}
              />
            </a>
            <div
              class={css`
                display: flex; gap: 24px;
                white-space: nowrap;
                @media (max-width: 1440px) {
                  flex-direction: column;
                }
              `}
            >
              <a href='/roadmap'>Roadmap</a>
              <a href='https://discord.gg/X7p8vVA4Y5' target='_blank'>
                Discord
              </a>
            </div>
            <div
              class={css`
                display: flex; white-space: nowrap;
                @media (max-width: 1440px) { flex-direction: column; }
              `}
            >
              {[
                ["Войти", "/login"],
                ["Попробовать", "/playground"],
              ].map(([title, h]) => (
                <a href={h}>
                  <div
                    class={css`
                      width: fit-content;
                      padding: 5px 20px;
                      border: 2px solid #31373e 5px;
                    `}
                  >
                    {title}
                  </div>
                </a>
              ))}
            </div>
          </header>
          <Squares
            class={css`
              position: absolute;
              left: -400px;
              bottom: -307px;
              @media (max-width: 1440px) {
                opacity: 0;
              }
            `}
          />
          <Squares
            class={css`
              position: absolute;
              left: -400px;
              bottom: -307px;
              @media (max-width: 1440px) {
                opacity: 0;
              }
            `}
          />
          <div
            class={css`
              text-align: center;
            `}
          >
            <div
              class={css`
                margin-inline: auto;
                max-width: 560px;
                margin-top: 60px;
              `}
            >
              <h1
                class={css`
                  font-family: Vigril;
                  font-size: 64px;
                  white-space: nowrap;
                  margin-inline: auto;
                `}
              >
                Представляем Bloki
              </h1>
              <p
                class={css`
                  font-family: sans-serif;
                  width: 370px; margin-inline: auto; color: var(--color-grey-900);
                  font-weight: 500; line-height: 130%; margin-block: 20px;
                `}
              >
                Сервис поможет вам, когда необходимо записать что-то, сделать
                домашнее задание, нарисовать схему или просто пофантазировать.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        class={css`
          background-color: #242527;
          border-radius: 0 / 62px;
        `}
      >
        <div
          class={css`
            display: flow-root;
            margin-inline: auto;
            max-width: 1440px;
          `}
        >
          <img
            class='relative b-rd-11px m-t-44px m-x-auto z-2 m-b-120px'
            src={BlokiPreview}
          />
        </div>
      </section>
      <section class='display-flow-root bg-#FAFAFA'>
        <div class='m-t-153px'>
          <h2 class='color-grey-800 font-400 font-vigril text-48px w-500px m-x-auto text-center'>
            <strong class='after:content-empty stroke-free'>Свободное</strong>{" "}
            расположение блоков
          </h2>
          <video
            class='h-auto m-t-42px m-x-auto b-rd-11px shadow-md'
            controls={false}
            loop
            muted
            autoplay
            playsinline
          >
            <source
              src={CursorsImageAV1}
              type='video/mp4; codecs=av01.0.05M.08,opus'
            />
            <source
              src={CursorsImageVP9}
              type='video/webm; codecs=vp8, vorbis'
            />
          </video>
        </div>
        <div class='m-t-153px'>
          <h2>Рисование и пометки поверх блоков</h2>
        </div>
        <div>
          <h2>Совместная работа в реальном времени</h2>
          <img src='' alt='' />
        </div>
        <div>
          <h2>Библиотека</h2>
          <img src='' alt='' />
        </div>
      </section>
      <section>
        <h3>А еще в Bloki можно</h3>
        <ul>
          <li></li>
        </ul>
        <h3>И много чего еще!</h3>
        <h3>Попробовать бесплатно</h3>
      </section>
      <footer></footer>
    </>
  );
}
