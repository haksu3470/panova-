// Node's type-stripping test runner does not resolve extensionless TypeScript
// imports. Next and `tsc` expect those same imports without a `.ts` suffix.
export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
