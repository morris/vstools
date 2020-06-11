export function resolve(specifier, context, defaultResolve) {
  return defaultResolve(
    specifier.replace('https://unpkg.com/three@0.117.1', 'three'),
    context,
    defaultResolve
  );
}

export function getFormat(url, context, defaultGetFormat) {
  if (url.match(/node_modules\/three\//)) {
    return {
      format: 'module',
    };
  }

  return defaultGetFormat(url, context, defaultGetFormat);
}
