import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  List,
  Toast,
  closeMainWindow,
  getPreferenceValues,
  open,
  showToast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import {
  articleAccessories,
  articleSearchText,
  loadArticles,
  type WikiArticle,
} from "./wiki.js";

type Preferences = {
  customKeywords?: string;
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data, error, isLoading, revalidate } = useCachedPromise(
    loadArticles,
    [preferences.customKeywords ?? ""],
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search by title, link, content, or custom keywords"
      throttle
    >
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title="Could not load Bisquit Wiki"
          description={error.message}
          actions={
            <ActionPanel>
              <Action
                title="Reload"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      ) : (
        data?.map((article) => (
          <ArticleListItem key={article.url} article={article} />
        ))
      )}
    </List>
  );
}

function ArticleListItem({ article }: { article: WikiArticle }) {
  return (
    <List.Item
      title={article.title}
      subtitle={article.path}
      accessories={articleAccessories(article)}
      keywords={articleSearchText(article).split(/\s+/)}
      icon={Icon.Document}
      actions={
        <ActionPanel>
          <Action
            title="Copy Link"
            icon={Icon.Clipboard}
            onAction={() => copyLink(article)}
          />
          <Action
            title="Open Article"
            icon={Icon.Globe}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            onAction={() => open(article.url)}
          />
          <Action.CopyToClipboard title="Copy Title" content={article.title} />
        </ActionPanel>
      }
    />
  );
}

async function copyLink(article: WikiArticle) {
  await Clipboard.copy(article.url);
  await showToast({
    style: Toast.Style.Success,
    title: "Copied link",
    message: article.title,
  });
  await closeMainWindow({ clearRootSearch: true });
}
