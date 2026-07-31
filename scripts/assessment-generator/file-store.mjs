import fs from "node:fs/promises";
import path from "node:path";

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function saveQuestionBank({
  level,
  questions,
  force,
}) {
  const directoryPath = path.join(
    process.cwd(),
    "question-bank",
    level,
  );

  const filePath = path.join(
    directoryPath,
    `english-${level.toLowerCase()}.json`,
  );

  await fs.mkdir(directoryPath, {
    recursive: true,
  });

  if ((await fileExists(filePath)) && !force) {
    throw new Error(
      [
        `File already exists: ${filePath}`,
        "Use --force to overwrite it.",
      ].join("\n"),
    );
  }

  await fs.writeFile(
    filePath,
    `${JSON.stringify(questions, null, 2)}\n`,
    "utf8",
  );

  return filePath;
}
