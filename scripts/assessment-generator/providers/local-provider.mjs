import fs from "node:fs/promises";
import path from "node:path";

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, files);
      continue;
    }

    if (
      entry.isFile() &&
      /^english-.*\.json$/i.test(entry.name)
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function getLocalQuestions() {
  const bankPath = path.join(
    process.cwd(),
    "question-bank",
  );

  const files = await walk(bankPath);

  const questions = [];

  for (const file of files) {
    const json = JSON.parse(
      await fs.readFile(file, "utf8"),
    );

    if (!Array.isArray(json)) {
      continue;
    }

    questions.push(...json);
  }

  return questions;
}
