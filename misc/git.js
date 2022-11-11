export const git = (/** @type {string} */ cmd) =>
   `'${String(execSync(cmd)).trimEnd().replaceAll("'", '"')}'`;
