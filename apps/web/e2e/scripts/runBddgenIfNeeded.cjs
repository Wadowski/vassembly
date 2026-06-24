const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const appRoot = path.resolve(__dirname, '../..');
const featuresDir = path.join(appRoot, 'e2e/features');
const stepsDir = path.join(appRoot, 'e2e/steps');
const outputDir = path.join(appRoot, '.features-gen');
const markerFile = path.join(outputDir, '.bddgen-marker');

const SOURCE_EXTENSIONS = new Set(['.feature', '.ts', '.tsx']);

const getLatestMtime = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    return 0;
  }

  let latestMtime = 0;

  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      latestMtime = Math.max(latestMtime, getLatestMtime(entryPath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }

    latestMtime = Math.max(latestMtime, fs.statSync(entryPath).mtimeMs);
  }

  return latestMtime;
};

const getMarkerMtime = () => {
  if (!fs.existsSync(markerFile)) {
    return 0;
  }

  return fs.statSync(markerFile).mtimeMs;
};

const sourceMtime = Math.max(getLatestMtime(featuresDir), getLatestMtime(stepsDir));
const markerMtime = getMarkerMtime();

if (sourceMtime <= markerMtime && fs.existsSync(outputDir)) {
  console.log('bddgen skipped: feature and step files unchanged');
  process.exit(0);
}

execSync('pnpm run bddgen', { cwd: appRoot, stdio: 'inherit' });
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(markerFile, String(Date.now()));
