const root = new URL('../../', import.meta.url);

/** Resolve `@/` imports so node:test can load lib modules that use the Next.js alias. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return nextResolve(new URL(`${specifier.slice(2)}.ts`, root).href, context);
  }
  return nextResolve(specifier, context);
}
