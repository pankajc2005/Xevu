// ============================================================
// FILE: src/pipeline/scanner/file-scanner.ts
// PURPOSE: Discover and classify all relevant files in a React project
// ============================================================

import fg from 'fast-glob';
import { readFile, stat } from 'fs/promises';
import { resolve, relative } from 'path';
import { Result, ok, err, tryCatch } from '../../infra/result.js';
import { ScanError } from '../../infra/errors.js';
import { logger } from '../../infra/logger.js';
import { DEFAULT_CONFIG, type XevuConfig } from '../../infra/config.js';
import { classifyFile, normalizePath } from '../../shared/utils.js';
import type { ScannedFile, ScannedProject, PackageJsonInfo, ProjectStructure } from '../../shared/types.js';
import { detectFramework } from './framework-detector.js';

export async function scanProject(
  projectRoot: string,
  config: XevuConfig = DEFAULT_CONFIG
): Promise<Result<ScannedProject, ScanError>> {
  logger.info('Starting project scan', { projectRoot });

  // 1. Validate project root exists
  try {
    const stats = await stat(projectRoot);
    if (!stats.isDirectory()) {
      return err(new ScanError(`"${projectRoot}" is not a directory`));
    }
  } catch {
    return err(new ScanError(`Project root "${projectRoot}" does not exist`));
  }

  // 2. Read package.json
  const pkgResult = await readPackageJson(projectRoot);
  if (!pkgResult.ok) {
    return err(new ScanError(`No package.json found in "${projectRoot}". Is this a Node.js project?`));
  }
  const packageJson = pkgResult.value;

  // 3. Discover files using fast-glob
  const globPattern = '**/*.{ts,tsx,js,jsx}';
  let filePaths: string[];
  try {
    filePaths = await fg(globPattern, {
      cwd: projectRoot,
      ignore: config.ignoredPatterns,
      absolute: true,
      onlyFiles: true,
      dot: false,
    });
  } catch (e) {
    return err(new ScanError(`File scan failed: ${e instanceof Error ? e.message : String(e)}`));
  }

  // 4. Apply file limit
  if (filePaths.length > config.maxFiles) {
    logger.warn(`Project has ${filePaths.length} files, limiting to ${config.maxFiles}`);
    filePaths = filePaths.slice(0, config.maxFiles);
  }

  // 5. Classify each file
  const files: ScannedFile[] = [];
  for (const absPath of filePaths) {
    try {
      const fileStat = await stat(absPath);
      if (fileStat.size > config.maxFileSizeBytes) {
        logger.warn('Skipping oversized file', { file: absPath, size: fileStat.size });
        continue;
      }
      const relPath = normalizePath(relative(projectRoot, absPath));
      files.push({
        absolutePath: normalizePath(absPath),
        relativePath: relPath,
        type: classifyFile(relPath),
        size: fileStat.size,
      });
    } catch {
      logger.warn('Could not stat file', { file: absPath });
    }
  }

  // 6. Detect framework
  const framework = detectFramework(packageJson, files);

  // 7. Detect project structure
  const structure = detectStructure(files);

  logger.info('Scan complete', {
    framework,
    fileCount: files.length,
    components: files.filter((f) => f.type === 'component').length,
  });

  return ok({
    root: normalizePath(projectRoot),
    framework,
    files,
    packageJson,
    structure,
  });
}

async function readPackageJson(projectRoot: string): Promise<Result<PackageJsonInfo, Error>> {
  return tryCatch(async () => {
    const raw = await readFile(resolve(projectRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    return {
      name: pkg.name ?? 'unknown',
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {},
    };
  }, 'Failed to read package.json');
}

function detectStructure(files: ScannedFile[]): ProjectStructure {
  const paths = files.map((f) => f.relativePath);
  const srcDir = paths.some((p) => p.startsWith('src/')) ? 'src' : null;

  return {
    hasPages: paths.some((p) => p.includes('/pages/') || p.includes('/app/')),
    hasComponents: paths.some((p) => p.includes('/components/')),
    hasLayouts: paths.some((p) => p.includes('layout')),
    hasHooks: paths.some((p) => p.includes('/hooks/') || p.includes('use')),
    hasStyles: files.some((f) => f.type === 'style'),
    hasTests: files.some((f) => f.type === 'test'),
    srcDir,
    entryFile: findEntryFile(paths),
  };
}

function findEntryFile(paths: string[]): string | null {
  const candidates = [
    'src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js',
    'src/main.tsx', 'src/main.ts', 'src/main.jsx', 'src/main.js',
    'src/App.tsx', 'src/App.jsx',
    'pages/_app.tsx', 'pages/_app.jsx',
    'app/layout.tsx', 'app/layout.jsx',
  ];
  return candidates.find((c) => paths.includes(c)) ?? null;
}
