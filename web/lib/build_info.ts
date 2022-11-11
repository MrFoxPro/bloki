export function getBuildInfo() {
   const date = new Date(GIT_COMMIT_DATE)
   const text = `Bloki
   Date: ${date.toLocaleString('ru', { dateStyle: 'full', timeStyle: 'medium' })}
   Message: ${GIT_LAST_COMMIT_MESSAGE}
   Branch/Commit: ${GIT_BRANCH_NAME}/${GIT_COMMIT_HASH}
`
   return { text }
}
export function printBuildInfo() {
   queueMicrotask(() => {
      const { text } = getBuildInfo()
      console.log(
         '%c%s',
         'color: #ffa61f; background: transparent; font-size: 16px; font-family: sans;',
         text
      )
   })
}
