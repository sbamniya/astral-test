import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

export function useSearchRealtime(id?: string) {
  const [results, setResults] = useState([]);
  const sessionId =
    typeof window === "undefined"
      ? id
      : (id ?? localStorage.getItem("sessionId"));

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (user) {
        setUserId(user.id);
      }
    };

    fetchUserId();
  }, [setUserId]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`search-events-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "search_events",
          filter: `user_id=eq.${userId},session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("payload", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  return results;
}
