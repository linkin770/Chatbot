// Ambient module declarations for dependencies that don't ship their own
// .d.ts files. Keep this file lean — only declare what's strictly needed.

declare module 'electron-squirrel-startup' {
  const value: boolean;
  export default value;
}
