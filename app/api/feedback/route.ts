import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_CATEGORIES = new Set(["bug", "idea", "question", "other"]);

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getFileExtension(file: File): string {
  switch (file.type) {
    case "image/png":
      return "png";

    case "image/jpeg":
      return "jpg";

    case "image/webp":
      return "webp";

    default:
      return "bin";
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const nameValue = formData.get("name");
    const emailValue = formData.get("email");
    const categoryValue = formData.get("category");
    const messageValue = formData.get("message");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";

    const email =
      typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

    const category =
      typeof categoryValue === "string" ? categoryValue.trim() : "";

    const message = typeof messageValue === "string" ? messageValue.trim() : "";

    if (!email || email.length > 320) {
      return NextResponse.json(
        {
          error: "Вкажіть коректну електронну пошту.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
      return NextResponse.json(
        {
          error: "Вкажіть коректну електронну пошту.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        {
          error: "Оберіть коректний тип звернення.",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length < 5) {
      return NextResponse.json(
        {
          error: "Опишіть ваше звернення трохи детальніше.",
        },
        {
          status: 400,
        },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          error: "Повідомлення не може містити більше 5000 символів.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 120) {
      return NextResponse.json(
        {
          error: "Ім’я не може містити більше 120 символів.",
        },
        {
          status: 400,
        },
      );
    }

    const attachments = formData
      .getAll("attachments")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );

    if (attachments.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        {
          error: `Можна додати не більше ${MAX_ATTACHMENTS} зображень.`,
        },
        {
          status: 400,
        },
      );
    }

    for (const file of attachments) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error: "Дозволені лише PNG, JPG, JPEG або WEBP зображення.",
          },
          {
            status: 400,
          },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: "Розмір одного зображення не може перевищувати 5 MB.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();

    const feedbackId = crypto.randomUUID();

    const attachmentPaths: string[] = [];

    for (let index = 0; index < attachments.length; index += 1) {
      const file = attachments[index];

      const extension = getFileExtension(file);

      const sanitizedName =
        sanitizeFileName(file.name) || `attachment-${index + 1}.${extension}`;

      const path = [
        user?.id ?? "anonymous",
        feedbackId,
        `${index + 1}-${sanitizedName}`,
      ].join("/");

      const fileBuffer = await file.arrayBuffer();

      const { error: uploadError } = await admin.storage
        .from("feedback-attachments")
        .upload(path, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("FEEDBACK ATTACHMENT UPLOAD ERROR:", uploadError);

        for (const uploadedPath of attachmentPaths) {
          await admin.storage
            .from("feedback-attachments")
            .remove([uploadedPath]);
        }

        return NextResponse.json(
          {
            error: "Не вдалося завантажити зображення. Спробуйте ще раз.",
          },
          {
            status: 500,
          },
        );
      }

      attachmentPaths.push(path);
    }

    const { error: insertError } = await admin
      .from("feedback_submissions")
      .insert({
        id: feedbackId,
        user_id: user?.id ?? null,
        name: name || null,
        email,
        category,
        message,
        attachment_paths: attachmentPaths,
        status: "new",
      });

    if (insertError) {
      console.error("FEEDBACK INSERT ERROR:", insertError);

      if (attachmentPaths.length > 0) {
        await admin.storage
          .from("feedback-attachments")
          .remove(attachmentPaths);
      }

      return NextResponse.json(
        {
          error: "Не вдалося надіслати звернення. Спробуйте ще раз.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: feedbackId,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("FEEDBACK API ERROR:", error);

    return NextResponse.json(
      {
        error: "Не вдалося обробити звернення. Спробуйте ще раз.",
      },
      {
        status: 500,
      },
    );
  }
}
