import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

type IconTarget = {
  label: string;
  path: string;
  size: number;
};

const DEFAULT_SOURCE = "public/logo/logo-colored.png";
const targets: readonly IconTarget[] = [
  { label: "app icon", path: "src/app/icon.png", size: 512 },
  { label: "apple touch icon", path: "src/app/apple-icon.png", size: 180 },
];

function getSourcePath() {
  const sourceFlagIndex = process.argv.indexOf("--source");

  if (sourceFlagIndex === -1) {
    return DEFAULT_SOURCE;
  }

  const source = process.argv[sourceFlagIndex + 1];

  if (!source) {
    throw new Error("Missing source path after --source.");
  }

  return source;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${kib.toFixed(1)} KiB`;
  }

  return `${(kib / 1024).toFixed(2)} MiB`;
}

async function generateIcon(sourcePath: string, target: IconTarget) {
  const outputPath = resolve(process.cwd(), target.path);
  await mkdir(dirname(outputPath), { recursive: true });

  await sharp(sourcePath)
    .rotate()
    .trim({ threshold: 5 })
    .resize(target.size, target.size, {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      fit: "contain",
      withoutEnlargement: false,
    })
    .png({
      adaptiveFiltering: true,
      compressionLevel: 9,
      palette: true,
    })
    .toFile(outputPath);

  const { size } = await stat(outputPath);
  console.log(
    `Generated ${target.label}: ${target.path} (${target.size}x${target.size}, ${formatBytes(size)})`,
  );
}

async function main() {
  const sourcePath = resolve(process.cwd(), getSourcePath());
  const metadata = await sharp(sourcePath).metadata();

  console.log(
    `Generating app icons from ${sourcePath} (${metadata.width ?? "?"}x${metadata.height ?? "?"})`,
  );

  for (const target of targets) {
    await generateIcon(sourcePath, target);
  }
}

await main();
