import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Необхідно увійти в обліковий запис." },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const admin = createAdminClient();

    const {
      data: feedbackRows,
      error: feedbackLoadError,
    } = await admin
      .from("feedback_submissions")
      .select("id, attachment_paths")
      .eq("user_id", user.id);

    if (feedbackLoadError) {
      console.error(
        "ACCOUNT DELETE FEEDBACK LOAD ERROR:",
        feedbackLoadError,
      );

      return NextResponse.json(
        {
          error:
            "Не вдалося підготувати дані облікового запису до видалення.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const attachmentPaths = (feedbackRows ?? []).flatMap(
      (row) =>
        Array.isArray(row.attachment_paths)
          ? row.attachment_paths.filter(
              (path): path is string =>
                typeof path === "string" &&
                path.length > 0,
            )
          : [],
    );

    if (attachmentPaths.length > 0) {
      const { error: storageError } = await admin.storage
        .from("feedback-attachments")
        .remove(attachmentPaths);

      if (storageError) {
        console.error(
          "ACCOUNT DELETE FEEDBACK STORAGE ERROR:",
          storageError,
        );

        return NextResponse.json(
          {
            error:
              "Не вдалося видалити пов'язані файли облікового запису.",
          },
          {
            status: 500,
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
      }
    }

    const { error: feedbackDeleteError } = await admin
      .from("feedback_submissions")
      .delete()
      .eq("user_id", user.id);

    if (feedbackDeleteError) {
      console.error(
        "ACCOUNT DELETE FEEDBACK ROWS ERROR:",
        feedbackDeleteError,
      );

      return NextResponse.json(
        {
          error:
            "Не вдалося видалити пов'язані дані облікового запису.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { error: deleteUserError } =
      await admin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error(
        "ACCOUNT DELETE AUTH USER ERROR:",
        deleteUserError,
      );

      return NextResponse.json(
        {
          error:
            "Не вдалося видалити обліковий запис. Спробуйте ще раз.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("ACCOUNT DELETE API ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Не вдалося видалити обліковий запис. Спробуйте ще раз.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}