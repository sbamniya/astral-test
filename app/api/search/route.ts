import { filterResultsWithGPT } from "@/lib/openai";
import {
  searchCK12,
  searchGooglePDFs,
  searchKhanAcademy,
} from "@/lib/sites/fetchAll";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import PQueue from "p-queue";

export const dynamic = "force-dynamic"; // ensure SSR

const queue = new PQueue({ concurrency: 10 });

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return new Response("Unauthorized", { status: 401 });
  }
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const grade = parseInt(searchParams.get("grade") || "5");

  if (!query) {
    return new Response("Query required", { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("search_sessions")
    .insert([
      {
        user_id: user?.id,
        query,
        grade,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting search session:", insertError);
    return new Response("Error inserting search session", { status: 500 });
  }

  queue.add(async () => {
    try {
      const response = await Promise.allSettled([
        searchCK12(data.id, user.id, query, grade),
        searchGooglePDFs(data.id, user.id, query, grade),
      ]);
      // Khan Academy search is not parallelized to avoid parallel requests
      const khanAcademyResult = await searchKhanAcademy(
        data.id,
        user.id,
        query
      );
      const allResults = response
        .filter((res) => res.status === "fulfilled")
        .map((res) => (res as PromiseFulfilledResult<any>).value)
        .flat();

      console.log("Result found. processing results");
      const filtered = await filterResultsWithGPT(
        [...allResults, ...khanAcademyResult],
        query,
        grade
      );
      console.log("Filtered results", filtered);
      const [, insertRes] = await Promise.all([
        supabase
          .from("search_sessions")
          .update([
            {
              status: "completed",
            },
          ])
          .eq("id", data.id),
        supabase.from("search_results").insert([
          {
            session_id: data.id,
            payload: filtered,
          },
        ]),
      ]);
      console.log(JSON.stringify(insertRes));
    } catch (error) {
      console.log("error");
      await supabase
        .from("search_sessions")
        .update([
          {
            status: "failed",
          },
        ])
        .eq("id", data.id);
    }
  });

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
