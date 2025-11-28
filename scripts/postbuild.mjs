import { readdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";

async function copyServerChunks() {
  const serverDir = path.join(process.cwd(), ".next", "server");
  const chunksDir = path.join(serverDir, "chunks");

  try {
    await stat(chunksDir);
  } catch {
    console.warn("[postbuild] chunks directory not found, skipping chunk copy.");
    return;
  }

  const entries = await readdir(chunksDir, { withFileTypes: true });
  const jsFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

  await Promise.all(
    jsFiles.map((file) => {
      const source = path.join(chunksDir, file.name);
      const destination = path.join(serverDir, file.name);
      return copyFile(source, destination);
    })
  );

  console.log(`[postbuild] Copied ${jsFiles.length} server chunk(s) for runtime compatibility.`);
}

await copyServerChunks();

