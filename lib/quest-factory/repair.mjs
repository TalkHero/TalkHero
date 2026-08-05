const PASSIVE = new Set([
  "narration",
  "dialogue",
  "completion",
]);

const INTERACTIVE = new Set([
  "choice",
  "input",
  "translate",
  "voice",
]);

const clean = (value) =>
  String(value ?? "").trim();

const unique = (values) => [
  ...new Set(
    (values ?? [])
      .map(clean)
      .filter(Boolean),
  ),
];

function slugify(
  value,
  fallback,
) {
  return (
    clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ||
    fallback
  );
}

function normalizeForLeakCheck(
  value,
) {
  return clean(value)
    .toLocaleLowerCase("en")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,!?;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function passive(scene) {
  scene.prompt = null;
  scene.options = [];
  scene.expectedAnswer = null;

  scene.evaluation = {
    mode: "manual",
    points: 0,
    allowRetry: false,
    maxAttempts: 1,
    feedbackCorrect: "",
    feedbackIncorrect: "",
  };
}

function choice(scene) {
  const options =
    (scene.options ?? []).slice(0, 3);

  while (options.length < 3) {
    const id =
      `option-${options.length + 1}`;

    options.push({
      id,
      text:
        `Option ${options.length + 1}`,
      value: id,
    });
  }

  scene.options = options.map(
    (option, index) => {
      const id = slugify(
        option.id,
        `option-${index + 1}`,
      );

      return {
        id,
        text:
          clean(option.text) ||
          `Option ${index + 1}`,
        value:
          clean(option.value) ||
          id,
      };
    },
  );

  const wanted =
    scene.expectedAnswer?.optionId;

  scene.expectedAnswer = {
    optionId:
      scene.options.some(
        (option) =>
          option.id === wanted,
      )
        ? wanted
        : scene.options[0].id,
  };

  scene.evaluation = {
    mode: "exact",
    points:
      Number.isFinite(
        scene.evaluation?.points,
      )
        ? Math.max(
            1,
            Math.trunc(
              scene.evaluation.points,
            ),
          )
        : 10,
    allowRetry: true,
    maxAttempts: 2,
    feedbackCorrect:
      clean(
        scene.evaluation
          ?.feedbackCorrect,
      ) || "Правильно!",
    feedbackIncorrect:
      clean(
        scene.evaluation
          ?.feedbackIncorrect,
      ) || "Спробуйте ще раз.",
  };
}

function textAnswer(scene) {
  const accepted = unique([
    ...(
      scene.expectedAnswer
        ?.acceptedAnswers ?? []
    ),
    scene.expectedAnswer?.value,
  ]);

  if (!accepted.length) {
    throw new Error(
      `Scene "${scene.code}" has no accepted answers.`,
    );
  }

  scene.options = [];

  scene.expectedAnswer = {
    acceptedAnswers: accepted,
  };

  scene.evaluation = {
    mode: "ai",
    points:
      Number.isFinite(
        scene.evaluation?.points,
      )
        ? Math.max(
            1,
            Math.trunc(
              scene.evaluation.points,
            ),
          )
        : 10,
    allowRetry: true,
    maxAttempts: 2,
    feedbackCorrect:
      clean(
        scene.evaluation
          ?.feedbackCorrect,
      ) || "Правильно!",
    feedbackIncorrect:
      clean(
        scene.evaluation
          ?.feedbackIncorrect,
      ) || "Спробуйте ще раз.",
  };
}

function getAcceptedAnswers(scene) {
  if (
    scene.type === "choice"
  ) {
    const optionId =
      scene.expectedAnswer?.optionId;

    const option =
      scene.options?.find(
        (candidate) =>
          candidate.id === optionId,
      );

    return option
      ? [
          option.text,
          option.value,
        ]
      : [];
  }

  return unique([
    ...(
      scene.expectedAnswer
        ?.acceptedAnswers ?? []
    ),
    scene.expectedAnswer?.value,
  ]);
}

function findAnswerLeak(scene) {
  if (
    ![
      "input",
      "translate",
      "voice",
    ].includes(scene.type)
  ) {
    return null;
  }

  const content =
    normalizeForLeakCheck(
      scene.content,
    );

  const prompt =
    normalizeForLeakCheck(
      scene.prompt,
    );

  const accepted =
    getAcceptedAnswers(scene)
      .map(normalizeForLeakCheck)
      .filter(
        (value) =>
          value.length >= 4,
      );

  for (const answer of accepted) {
    if (
      content === answer ||
      prompt === answer
    ) {
      return {
        field:
          content === answer
            ? "content"
            : "prompt",
        answer,
        reason:
          "field exactly matches an accepted answer",
      };
    }

    if (
      answer.length >= 12 &&
      content.includes(answer)
    ) {
      return {
        field: "content",
        answer,
        reason:
          "content contains an accepted answer",
      };
    }

    if (
      answer.length >= 12 &&
      prompt.includes(answer)
    ) {
      return {
        field: "prompt",
        answer,
        reason:
          "prompt contains an accepted answer",
      };
    }
  }

  const forbiddenHeadings = [
    "your response to",
    "your answer",
    "correct answer",
    "model answer",
    "sample answer",
  ];

  const heading =
    forbiddenHeadings.find(
      (value) =>
        prompt.startsWith(value),
    );

  if (heading) {
    return {
      field: "prompt",
      answer: heading,
      reason:
        "generic answer-revealing heading is not a learner instruction",
    };
  }

  return null;
}

function hasLearningCoachFeedback(
  value,
) {
  const feedback =
    clean(value);

  return (
    feedback.includes(
      "Природніше англійською:",
    ) &&
    feedback.includes(
      "Чому саме так:",
    ) &&
    (
      feedback.includes(
        "Запам'ятайте:",
      ) ||
      feedback.includes(
        "Запам’ятайте:",
      )
    )
  );
}

function validateLearningCoach(
  scene,
  errors,
) {
  if (
    !INTERACTIVE.has(scene.type)
  ) {
    return;
  }

  const incorrect =
    clean(
      scene.evaluation
        ?.feedbackIncorrect,
    );

  const correct =
    clean(
      scene.evaluation
        ?.feedbackCorrect,
    );

  if (
    !hasLearningCoachFeedback(
      incorrect,
    )
  ) {
    errors.push(
      `${scene.code}: feedbackIncorrect must contain natural answer, explanation and remember blocks`,
    );
  }

  if (
    correct.length < 12
  ) {
    errors.push(
      `${scene.code}: feedbackCorrect is too short`,
    );
  }

  if (
    !/[А-Яа-яІіЇїЄєҐґ]/u.test(
      correct,
    )
  ) {
    errors.push(
      `${scene.code}: feedbackCorrect must be Ukrainian`,
    );
  }

  const normalizedIncorrect =
    incorrect.toLocaleLowerCase(
      "uk",
    );

  const weakPatterns = [
  "будьте ввічливими",
  "гарна відповідь",
  "добре зроблено",
  "правильна відповідь",
  "ви молодець",
  "це правильна відповідь",
  "ясність важлива",
  "задавайте питання",
  "вказуйте точну інформацію",
  "завжди використовуйте",
  "твердість і ясність",
  "важливі при підтвердженні",
  "виражає ввічливість і формальність",
  "i'm showing my passport",
  "i want to proceed",
  "i want to exchange",
  "умови безкоштовно",
  "звучить ввічливо та потужно",
  "ідеальний привітний",
  ];

  for (
    const pattern
    of weakPatterns
  ) {
    if (
      normalizedIncorrect.includes(
        pattern.toLocaleLowerCase(
          "uk",
        ),
      )
    ) {
      errors.push(
        `${scene.code}: feedback contains weak or unnatural wording: ${pattern}`,
      );
    }
  }

  if (
    incorrect.includes(
      "'I'd like to...' -",
    )
  ) {
    errors.push(
      `${scene.code}: use a proper dash instead of a hyphen in Ukrainian feedback`,
    );
  }

  const rememberMatch =
    incorrect.match(
      /Запам(?:'|’)ятайте:\s*(.+)$/su,
    );

  if (!rememberMatch) {
    errors.push(
      `${scene.code}: remember block is missing`,
    );

    return;
  }

  const remember =
    clean(rememberMatch[1]);

  if (
    remember.length < 12
  ) {
    errors.push(
      `${scene.code}: remember block is too short`,
    );
  }

  if (
    /remember this answer/i.test(
      remember,
    )
  ) {
    errors.push(
      `${scene.code}: remember block repeats the answer instead of teaching`,
    );
  }
}

function repairInteractiveContentLeaks(
  scenes,
) {
  for (
    let index = 0;
    index < scenes.length;
    index += 1
  ) {
    const scene = scenes[index];

    if (
      ![
        "input",
        "voice",
      ].includes(scene.type)
    ) {
      continue;
    }

    const leak =
      findAnswerLeak(scene);

    if (
      !leak ||
      leak.field !== "content"
    ) {
      continue;
    }

    const previousDialogue =
      scenes
        .slice(0, index)
        .reverse()
        .find(
          (candidate) =>
            candidate.type ===
              "dialogue" &&
            clean(
              candidate.content,
            ),
        );

    scene.content =
      previousDialogue?.content ||
      (
        scene.speaker
          ? `${scene.speaker} is waiting for your response.`
          : "The character is waiting for your response."
      );

    const prompt =
      clean(scene.prompt)
        .toLocaleLowerCase(
          "en",
        );

    if (
      !scene.prompt ||
      prompt.startsWith(
        "your response",
      ) ||
      prompt.startsWith(
        "your answer",
      )
    ) {
      scene.prompt =
        "Дайте коротку природну відповідь англійською.";
    }
  }
}

export function repairQuest(
  raw,
  request,
) {
  const q =
    structuredClone(raw);

  q.campaignSlug =
    request.campaignSlug ??
    q.campaignSlug ??
    "english-basics";

  q.episodeSlug =
    request.episodeSlug ??
    q.episodeSlug ??
    "first-contact";

  q.slug = slugify(
    request.slug ??
      q.slug ??
      request.theme,
    "generated-quest",
  );

  q.title = clean(
    request.title ??
      q.title ??
      request.theme,
  );

  q.description = clean(
    q.description ??
      request.learningGoal,
  );

  q.questType =
    q.questType ??
    "conversation";

  q.cefrLevel =
    request.cefrLevel;

  q.orderIndex =
    request.orderIndex;

  q.estimatedMinutes =
    request.estimatedMinutes ??
    q.estimatedMinutes ??
    12;

  q.xpReward =
    request.xpReward ??
    q.xpReward ??
    70;

  q.coinReward =
    request.coinReward ??
    q.coinReward ??
    24;

  q.act = {
    code: slugify(
      q.act?.code,
      "main",
    ),
    title: clean(
      q.act?.title ??
        q.title,
    ),
    description: clean(
      q.act?.description ??
        q.description,
    ),
  };

  q.adventure = {
    slug:
      request.adventureSlug ??
      q.adventure?.slug ??
      "london-first-day",
    location: clean(
      q.adventure?.location ??
        request.theme,
    ),
  };

  q.metadata = {
    templateCategory: clean(
      q.metadata
        ?.templateCategory ??
        request.category ??
        request.theme,
    ),
    staticTest: true,
  };

  const used =
    new Set();

  q.scenes = (
    Array.isArray(q.scenes)
      ? q.scenes
      : []
  ).map(
    (source, index) => {
      const scene = {
        ...source,
      };

      let code = slugify(
        scene.code,
        `scene-${index + 1}`,
      );

      while (
        used.has(code)
      ) {
        code =
          `${code}-${index + 1}`;
      }

      used.add(code);

      scene.code = code;

      scene.speaker =
        scene.speaker == null
          ? null
          : clean(
              scene.speaker,
            );

      scene.content =
        clean(scene.content);

      scene.prompt =
        scene.prompt == null
          ? null
          : clean(
              scene.prompt,
            );

      scene.metadata = {
        role: clean(
          scene.metadata?.role,
        ),
        avatar:
          clean(
            scene.metadata?.avatar,
          ) || "💬",
        emotion:
          clean(
            scene.metadata
              ?.emotion,
          ) || "neutral",
        goal: clean(
          scene.metadata?.goal,
        ),
        learnedWords: unique(
          scene.metadata
            ?.learnedWords,
        ),
      };

      if (
        PASSIVE.has(
          scene.type,
        )
      ) {
        passive(scene);
      } else if (
        scene.type === "choice"
      ) {
        choice(scene);
      } else if (
        INTERACTIVE.has(
          scene.type,
        )
      ) {
        textAnswer(scene);
      }

      return scene;
    },
  );

  repairInteractiveContentLeaks(
    q.scenes,
  );

  if (!q.scenes.length) {
    throw new Error(
      "AI returned no scenes.",
    );
  }

  q.scenes[0].type =
    "narration";

  passive(q.scenes[0]);

  const last =
    q.scenes.at(-1);

  last.type =
    "completion";

  last.code =
    "summary";

  passive(last);

  return q;
}

export function validateQuest(q) {
  const errors = [];

  const codes =
    new Set();

  if (!q.slug) {
    errors.push(
      "slug is empty",
    );
  }

  if (
    !Array.isArray(q.scenes) ||
    q.scenes.length < 2
  ) {
    errors.push(
      "not enough scenes",
    );
  }

  for (
    const [index, scene]
    of (q.scenes ?? []).entries()
  ) {
    if (!scene.code) {
      errors.push(
        `scenes[${index}].code is empty`,
      );
    } else if (
      codes.has(scene.code)
    ) {
      errors.push(
        `duplicate code ${scene.code}`,
      );
    } else {
      codes.add(scene.code);
    }

    if (!scene.content) {
      errors.push(
        `scenes[${index}].content is empty`,
      );
    }

    if (
      scene.type === "choice" &&
      scene.options.length !== 3
    ) {
      errors.push(
        `${scene.code} must have 3 options`,
      );
    }

    if (
      INTERACTIVE.has(
        scene.type,
      ) &&
      !scene.expectedAnswer
    ) {
      errors.push(
        `${scene.code} has no expectedAnswer`,
      );
    }

    validateLearningCoach(
      scene,
      errors,
    );

    const leak =
      findAnswerLeak(scene);

    if (leak) {
      errors.push(
        `${scene.code}: answer leak in ${leak.field} (${leak.reason})`,
      );
    }
  }

  if (
    q.scenes?.at(-1)?.type !==
    "completion"
  ) {
    errors.push(
      "final scene is not completion",
    );
  }

  if (errors.length) {
    throw new Error(
      [
        "Validation failed:",
        ...errors.map(
          (error) =>
            `- ${error}`,
        ),
      ].join("\n"),
    );
  }
}
