import s from './build-info.module.scss';

export function BuildInfo() {
   const date = new Date(import.meta.env.VITE_GIT_COMMIT_DATE);
   return (
      <div class={s.buildInfo}>
         <span>{date.toLocaleString('ru', { dateStyle: 'full', timeStyle: 'medium' })}</span>
         <span>{import.meta.env.VITE_GIT_LAST_COMMIT_MESSAGE}</span>
         <span>{import.meta.env.VITE_GIT_BRANCH_NAME}/{import.meta.env.VITE_GIT_COMMIT_HASH}</span>
      </div>
   );
}