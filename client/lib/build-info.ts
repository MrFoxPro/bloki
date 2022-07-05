export function useConsoleBuildInfo() {
   queueMicrotask(() => {
      const date = new Date(import.meta.env.VITE_GIT_COMMIT_DATE);
      const str = `Bloki
   Date: ${date.toLocaleString('ru', { dateStyle: 'full', timeStyle: 'medium' })}
   Message: ${import.meta.env.VITE_GIT_LAST_COMMIT_MESSAGE}
   Branch/Commit: ${import.meta.env.VITE_GIT_BRANCH_NAME}/${import.meta.env.VITE_GIT_COMMIT_HASH}`;
      console.log('%c%s', 'color: #ffa61f; background: transparent; font-size: 16px; font-family: sans;', str);
   });
}
