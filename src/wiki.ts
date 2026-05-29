export const wikiOrigin = "https://bisquit.host";

export type WikiSearchState = {
  query: string;
  results: WikiSearchResult[];
  total: number;
};

export type WikiSearchResult = {
  slug: string;
  title: string;
  section: string;
  href: string;
  excerpt: WikiSearchExcerptSegment[];
  score: number;
};

export type WikiSearchExcerptSegment = {
  text: string;
  match: boolean;
};

export async function searchWiki(query: string): Promise<WikiSearchState> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { query: "", results: [], total: 0 };
  }

  const response = await fetch(`${wikiOrigin}/wiki/search`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: trimmedQuery }),
  });

  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Search returned a non-JSON response");
  }

  return (await response.json()) as WikiSearchState;
}

export function resultUrl(result: WikiSearchResult): string {
  return new URL(result.href, wikiOrigin).toString();
}

export function excerptText(result: WikiSearchResult): string {
  return result.excerpt
    .map((segment) => segment.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
