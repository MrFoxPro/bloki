/** @type {import('prettier').Config}*/
module.exports = {
   endOfLine: 'lf',
   printWidth: 105,
   singleQuote: true,
   semi: false,
   useTabs: false,
   trailingComma: 'es5',
   editorconfig: true,
   jsxSingleQuote: true,
   htmlWhitespaceSensitivity: 'ignore',
   quoteProps: 'consistent',
   plugins: [require.resolve('prettier-plugin-astro')],
   overrides: [
      {
         files: '*.astro',
         options: {
            parser: 'astro',
         },
      },
   ],
}
