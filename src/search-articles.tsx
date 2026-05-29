import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  List,
  Toast,
  closeMainWindow,
  open,
  showToast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import {
  excerptText,
  resultUrl,
  searchWiki,
  type WikiSearchResult,
} from "./wiki.js";

export default function Command() {
  const [query, setQuery] = useState("");
  const { data, error, isLoading, revalidate } = useCachedPromise(
    searchWiki,
    [query],
    {
      keepPreviousData: true,
    },
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search Bisquit Wiki"
      throttle
    >
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title="Could not search Bisquit Wiki"
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
      ) : query.trim() ? (
        data?.results.map((result) => (
          <SearchResultItem key={result.href} result={result} />
        ))
      ) : (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search Bisquit Wiki"
        />
      )}
    </List>
  );
}

function SearchResultItem({ result }: { result: WikiSearchResult }) {
  const url = resultUrl(result);

  return (
    <List.Item
      title={result.title}
      subtitle={result.section}
      accessories={[{ text: excerptText(result) }]}
      icon={Icon.Document}
      actions={
        <ActionPanel>
          <Action
            title="Open Article"
            icon={Icon.Globe}
            onAction={() => open(url)}
          />
          <Action
            title="Copy Link"
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
            onAction={() => copyLink(url, result.title)}
          />
          <Action.CopyToClipboard title="Copy Title" content={result.title} />
        </ActionPanel>
      }
    />
  );
}

async function copyLink(url: string, title: string) {
  await Clipboard.copy(url);
  await showToast({
    style: Toast.Style.Success,
    title: "Copied link",
    message: title,
  });
  await closeMainWindow({ clearRootSearch: true });
}
