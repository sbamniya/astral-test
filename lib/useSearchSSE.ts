import { SearchResult } from "@/lib/sites/fetchAll";
import { useEffect, useState } from "react";

export function useSearchSSE(query: string, grade: number) {
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    console.log(localStorage.getItem("sessionId"));
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}&grade=${grade}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        localStorage.setItem("sessionId", data.id);
        setSession(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, grade]);

  return { session, loading };
}
