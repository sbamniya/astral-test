import { createClient } from "@/utils/supabase/client";
import { isServer } from "@/utils/utils";
import { useEffect, useState } from "react";

const supabase = createClient();

export type SearchResultType = {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
};

export function useSearchResult(userId: string | null, id?: string) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResultType[]>([]);

  const sessionId = isServer() ? id : (id ?? localStorage.getItem("sessionId"));
  useEffect(() => {
    if (!sessionId || !userId) return;
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from("search_results")
        .select("*")
        .eq("session_id", sessionId)
        .select()
        .maybeSingle();

      setLoading(false);
      if (error) {
        console.error("Error fetching search results:", error);
        return;
      }
      if (data) setResults(data.payload);
    };
    const channel = supabase
      .channel(`search-results-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "search_results",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setResults(payload.new.payload as SearchResultType[]);
          }
        }
      )
      .subscribe();
    fetchResults();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  return { data: results, loading };
}
