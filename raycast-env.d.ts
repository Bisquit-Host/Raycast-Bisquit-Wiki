/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Custom Keywords - Optional aliases, one per line: keyword: article title or URL, another keyword */
  "customKeywords"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-articles` command */
  export type SearchArticles = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-articles` command */
  export type SearchArticles = {}
}

