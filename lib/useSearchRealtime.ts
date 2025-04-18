import { createClient } from "@/utils/supabase/client";
import { isServer } from "@/utils/utils";
import { useEffect, useState } from "react";

const supabase = createClient();

type Event = {
  created_at: string;
  id: string;
  payload: Record<string, any>;
  session_id: string;
  site: string;
  status: string;
  user_id: string;
};
export function useSearchRealtime(userId: string | null, id?: string) {
  const [results, setResults] = useState<Event[]>([]);

  const sessionId = isServer() ? id : (id ?? localStorage.getItem("sessionId"));

  useEffect(() => {
    if (!sessionId || !userId) return;
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from("search_events")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching search results:", error);
        return;
      }
      setResults(data);
    };
    const channel = supabase
      .channel(`search-events-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "search_events",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setResults((prevResults) => [...prevResults, payload.new as Event]);
          }
        }
      )
      .subscribe();
    fetchResults();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  return results;
}
