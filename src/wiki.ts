import * as cheerio from "cheerio";

const baseUrl = "https://wiki.bisquit.host";

export type WikiArticle = {
  title: string;
  url: string;
  path: string;
  section: string;
  content: string;
  keywords: string[];
};

type VitePressSiteData = {
  themeConfig?: {
    sidebar?: SidebarGroup[];
  };
};

type SidebarGroup = {
  text?: string;
  items?: SidebarItem[];
};

type SidebarItem = {
  text?: string;
  link?: string;
  items?: SidebarItem[];
};

export async function loadArticles(
  customKeywords: string,
): Promise<WikiArticle[]> {
  const homeHtml = await fetchText(baseUrl);
  const hashMap = parseJsonAssignment<Record<string, string>>(
    homeHtml,
    "__VP_HASH_MAP__",
  );
  const siteData = parseJsonAssignment<VitePressSiteData>(
    homeHtml,
    "__VP_SITE_DATA__",
  );
  const sidebarArticles = flattenSidebar(siteData.themeConfig?.sidebar ?? []);
  const keywordMap = parseCustomKeywords(customKeywords);

  return Promise.all(
    sidebarArticles.map(async ({ title, path, section }) => {
      const relativePath = `${path.replace(/^\//, "")}.md`;
      const chunkKey = relativePath.replaceAll("/", "_");
      const hash = hashMap[chunkKey];
      const html = hash ? await fetchPageHtml(chunkKey, hash) : "";
      const content = htmlToText(html);
      const url = new URL(path, baseUrl).toString();
      const keywords = keywordMap.get(path) ?? [];

      return { title, url, path, section, content, keywords };
    }),
  );
}

export function articleSearchText(article: WikiArticle): string {
  return [
    article.title,
    article.url,
    article.path,
    article.section,
    article.content,
    ...article.keywords,
  ].join(" ");
}

export function articleAccessories(article: WikiArticle) {
  const accessories = [{ text: article.section }];

  if (article.keywords.length > 0) {
    accessories.push({ text: article.keywords.join(", ") });
  }

  return accessories;
}

async function fetchPageHtml(chunkKey: string, hash: string): Promise<string> {
  const chunk = await fetchText(`${baseUrl}/assets/${chunkKey}.${hash}.js`);
  const htmlMatch = chunk.match(/n\(`([\s\S]*?)`,13\)/);

  if (!htmlMatch?.[1]) {
    return "";
  }

  return htmlMatch[1].replaceAll("\\`", "`");
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.text();
}

function parseJsonAssignment<T>(html: string, name: string): T {
  const match = html.match(
    new RegExp(`window\\.${name}=JSON\\.parse\\("([\\s\\S]*?)"\\)`),
  );

  if (!match?.[1]) {
    throw new Error(`Could not find ${name}`);
  }

  return JSON.parse(JSON.parse(`"${match[1]}"`)) as T;
}

function flattenSidebar(groups: SidebarGroup[]) {
  return groups.flatMap((group) =>
    flattenSidebarItems(group.items ?? [], group.text ?? "Wiki"),
  );
}

function flattenSidebarItems(
  items: SidebarItem[],
  section: string,
): { title: string; path: string; section: string }[] {
  return items.flatMap((item) => {
    const nested = flattenSidebarItems(item.items ?? [], item.text ?? section);
    const current =
      item.text && item.link
        ? [{ title: item.text, path: item.link, section }]
        : [];

    return [...current, ...nested];
  });
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);

  $(".header-anchor, .table-of-contents").remove();

  return $.root().text().replace(/\s+/g, " ").trim();
}

function parseCustomKeywords(input: string): Map<string, string[]> {
  const keywordMap = new Map<string, string[]>();

  for (const line of input.split(/\r?\n/)) {
    const [rawKeyword, rawTargets] = line.split(":", 2);
    const keyword = rawKeyword?.trim();

    if (!keyword || !rawTargets) {
      continue;
    }

    for (const target of rawTargets.split(",")) {
      const normalizedTarget = normalizeTarget(target);
      const existing = keywordMap.get(normalizedTarget) ?? [];

      keywordMap.set(normalizedTarget, [...existing, keyword]);
    }
  }

  return keywordMap;
}

function normalizeTarget(target: string): string {
  const trimmed = target.trim();

  if (trimmed.startsWith(baseUrl)) {
    return new URL(trimmed).pathname;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\//, "")}`;
}
