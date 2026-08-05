import {
  readFile,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  validateQuest,
} from "../lib/quest-factory/repair.mjs";

async function collectJsonFiles(
  inputPath,
) {
  const absolute =
    path.resolve(inputPath);

  if (
    absolute.endsWith(".json")
  ) {
    return [absolute];
  }

  const names =
    await readdir(absolute);

  return names
    .filter(
      (name) =>
        name.endsWith(".json"),
    )
    .sort()
    .map(
      (name) =>
        path.join(
          absolute,
          name,
        ),
    );
}

async function main() {
  const input =
    process.argv[2] ??
    "content/generated";

  const files =
    await collectJsonFiles(
      input,
    );

  if (!files.length) {
    throw new Error(
      `No JSON files found in ${input}`,
    );
  }

  let failed = 0;

  for (const file of files) {
    try {
      const quest =
        JSON.parse(
          await readFile(
            file,
            "utf8",
          ),
        );

      validateQuest(quest);

      console.log(
        `✓ ${path.basename(file)}`,
      );
    } catch (error) {
      failed += 1;

      console.error(
        `✗ ${path.basename(file)}`,
      );

      console.error(
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  if (failed > 0) {
    throw new Error(
      `${failed} quest file(s) failed validation.`,
    );
  }
}

main().catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
