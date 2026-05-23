// ============================================================
// FILE: src/pipeline/scanner/framework-detector.ts
// PURPOSE: Detect which React framework/bundler the project uses
// ============================================================

import type { Framework, PackageJsonInfo, ScannedFile } from '../../shared/types.js';

export function detectFramework(pkg: PackageJsonInfo, files: ScannedFile[]): Framework {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Check in order of specificity
  if ('next' in allDeps) return 'nextjs';
  if ('@remix-run/react' in allDeps || '@remix-run/node' in allDeps) return 'remix';
  if ('gatsby' in allDeps) return 'gatsby';

  // Vite detection: dependency or config file
  if ('vite' in allDeps) return 'vite';
  if (files.some((f) => f.relativePath.match(/vite\.config\.(ts|js|mjs)$/))) return 'vite';

  // CRA detection: react-scripts
  if ('react-scripts' in allDeps) return 'cra';

  return 'unknown';
}
