import { createClient } from "@/utils/supabase/server";
import * as cheerio from "cheerio";
import SerpApi from "google-search-results-nodejs";
import puppeteer from "puppeteer";
import { extractResultsFromHTML } from "../openai";

const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY!);

// Utility type
export interface SearchResult {
  title: string;
  description: string;
  link: string;
  image: string;
  type: string;
}

const scrapContent = async (url: string, selector: string) => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("Launching browser...");
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "networkidle2" });
  console.log("Waiting for content...");
  await page.waitForSelector(selector);
  console.log("Content loaded, extracting...");
  const htmlContent = await page.evaluate((selector) => {
    const containers = Array.from(document.querySelectorAll(selector));
    return containers.map((el) => el.outerHTML).join("\n");
  }, selector);
  console.log("Extracted content, closing browser...");
  // Close the browser
  await browser.close();

  return htmlContent;
};

// 1. CK12 Search
export async function searchCK12(
  sessionId: string,
  userId: string,
  query: string,
  grade: number
): Promise<SearchResult[]> {
  const supabase = await createClient();
  try {
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "CK12",
        status: "started",
        payload: {},
      },
    ]);
    const searchParams = new URLSearchParams();
    searchParams.set("referrer", "search");
    searchParams.set("pageNum", "1");
    searchParams.set("tabId", "communityContributedContentTab");
    searchParams.set("gradeFilters", grade.toString());
    searchParams.set("q", query);
    const searchUrl = `https://www.ck12.org/search/?${searchParams.toString()}`;
    console.log("Fetching CK12 search results...");
    const htmlContent = await scrapContent(
      searchUrl,
      '[class^="ContentList__ListContainer"]'
    );
    const data = await extractResultsFromHTML(htmlContent, query);
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "CK12",
        status: "completed",
        payload: data,
      },
    ]);

    return data;
  } catch (error) {
    console.error("Error fetching CK12 search results:", error);
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "CK12",
        status: "failed",
        payload: {},
      },
    ]);
  }

  return [];
}

// 2. Khan Academy Search
export async function searchKhanAcademy(
  sessionId: string,
  userId: string,
  query: string
): Promise<SearchResult[]> {
  const results: {
    title: string;
    description: string;
    link: string;
    image: string;
    type: string;
    subject?: string;
  }[] = [];
  const supabase = await createClient();
  try {
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "khan_academy",
        status: "started",
        payload: {},
      },
    ]);
    const searchParams = new URLSearchParams();
    searchParams.set("page_search_query", query);
    searchParams.set("search_again", "1");
    const url = `https://www.khanacademy.org/search?${searchParams.toString()}`;

    const html = await scrapContent(url, "#indexed-search-results");
    const $ = cheerio.load(html);

    console.log("Parsing Khan Academy results...");
    $("ul li").each((_, li) => {
      const anchor = $(li).find("a");
      const url = anchor.attr("href");
      const title = $(li).find("._2dibcm7").text().trim(); // This seems to be the title
      const description = $(li).find("._1n941cdr").text().trim(); // Optional description
      const type = $(li).find("._1ufuji7").text().trim(); // Video, Article, etc.
      const subject = $(li).find("._12itjrk5").text().trim(); // Subject or grade
      const imgTag = $(li).find("img").first();
      const image = imgTag.length ? imgTag.attr("src") : null;

      results.push({
        link: `https://www.khanacademy.org${url ?? ""}`,
        title,
        type,
        subject,
        description,
        image: image ?? "",
      });
    });
    console.log("Khan Academy results parsed successfully.");
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "khan_academy",
        status: "completed",
        payload: results,
      },
    ]);
  } catch (error) {
    console.error("Error fetching Khan Academy search results:", error);
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "khan_academy",
        status: "failed",
        payload: {},
      },
    ]);
  }

  return results; // Limit for now
}

// 3. Google PDF Search via SerpAPI (mocked structure)
export async function searchGooglePDFs(
  sessionId: string,
  userId: string,
  topic: string,
  grade?: string | number
): Promise<SearchResult[]> {
  const supabase = await createClient();
  try {
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "google_pdf",
        status: "started",
        payload: {},
      },
    ]);

    const results = await new Promise<SearchResult[]>((resolve, reject) => {
      const query = `${topic} ${grade ? `class ${grade}` : ""} filetype:pdf`;

      search.json(
        {
          q: query,
          engine: "google",
          num: 10,
          hl: "en",
          gl: "in",
        },
        (data: any) => {
          try {
            const results: SearchResult[] = data.organic_results
              .filter((r: any) => r.link.endsWith(".pdf"))
              .map((r: any) => ({
                title: r.title,
                link: r.link,
                description: r.snippet,
                type: "Worksheet",
              }));
            resolve(results);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "google_pdf",
        status: "completed",
        payload: results,
      },
    ]);
    return results;
  } catch (error) {
    console.error("Error fetching Google PDF search results:", error);
    await supabase.from("search_events").insert([
      {
        session_id: sessionId,
        user_id: userId,
        site: "google_pdf",
        status: "failed",
        payload: {},
      },
    ]);
  }
  return [];
}
