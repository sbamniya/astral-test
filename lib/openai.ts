import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(
      text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/, "")
    );
  } catch (e) {
    console.error("Could not parse JSON", e, text);
    return [];
  }
};

export async function filterResultsWithGPT(
  results: any[],
  query: string,
  grade?: number
) {
  const prompt = `
You are a learning assistant. Given search results and a topic "${query}" ${grade ? `for grade ${grade}` : ""}, your task is to filter and prioritize the results based on relevance and quality.
return only relevant entries in JSON format like:
[{ "title": "...", "description": "...", "link": "...", "image": "...", "type": "..." }]

Results:
${JSON.stringify(results.slice(0, 10))}
`;

  const res = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
    temperature: 0.4,
  });

  const json = res.choices[0].message.content || "[]";
  return safeParseJson(json);
}

export async function extractResultsFromHTML(html: string, query: string) {
  const prompt = `
The following is a raw HTML snippet from a search results page for "${query}" on CK12.org. 

Your task is to extract and return a JSON array of at most 5 relevant search results with the following fields:
- title
- description
- link
- image
- type (one of "Video", "Game", "Interactive Lesson", "Worksheet", or "Lesson")

Only return the array. Do not include any explanations or markdown.

HTML content:
${html.slice(0, 15000)} 
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const text = chat.choices[0].message.content || "[]";
  return safeParseJson(text);
}
