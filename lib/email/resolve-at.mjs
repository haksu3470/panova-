const root = new URL('../../', import.meta.url);

/** Resolve `@/` imports so node:test can load lib modules that use the Next.js alias. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return nextResolve(new URL(`${specifier.slice(2)}.ts`, root).href, context);
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !pathHasExtension(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}

function pathHasExtension(specifier) {
  const path = specifier.split(/[?#]/, 1)[0];
  return /\.[a-z0-9]+$/i.test(path);
}
