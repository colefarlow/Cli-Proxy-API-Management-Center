# Proxy Atelier

A personal desktop fork of [CLI Proxy API Management Center](https://github.com/router-for-me/Cli-Proxy-API-Management-Center), packaged as a macOS AppKit application. The existing proxy engine and service stay independent.

## Use

Open **Proxy Atelier** from `~/Applications`. Choose MacBook or LinuxBox2 in the header to inspect that proxy. This changes only the management connection; it does not switch T3 providers or move active conversations. The daily navigation is Dashboard, Accounts and Advanced. Advanced links to Quota, Connections, Routing, Providers, Configuration, Activity, System and the original dashboard. **Optimizations** reports the live settings discussed in the supplied video transcript, including recent health of the separately installed reset-priority helper.

The redesigned overview puts provider quota readings and relative reset countdowns beside account names. Exact reset timestamps remain available on hover, and request activity is collapsed until opened. Missing data is shown as unavailable. Weekly capacity is an unweighted average across the active Claude accounts, not a combined token budget. Account rows are ordered by current proxy priority. Quotas refresh every five minutes while the app is open; the priority helper runs independently every fifteen minutes. Closing the window or quitting this app does not stop the proxy or helper.

## Authentication

The app reads the already-authorized Mac management key from `~/.config/cliproxyapi/client-keys.json` at request time. The WebKit interface receives a public native-transport marker rather than that authentication key. For LinuxBox2, `/usr/bin/ssh` uses the existing `linuxbox2` host configuration in batch mode; a standard-library Python request reads the key on LinuxBox2. No remote management key or provider token is copied to the Mac. The app uses a nonpersistent WebKit data store, disables HTTP redirects in native transport, and permits management requests only to the fixed local proxy through this channel. No proxy process is managed by the app.

Existing advanced management screens can display or edit sensitive configuration when a user explicitly opens them. Do not capture or publish those screens with credentials visible. This source tree and app bundle contain no real keys or account token files.

## Build

Frontend tests and bundling run on LinuxBox3:

```sh
rsync -az --exclude .git --exclude node_modules --exclude dist --exclude .build ./ linuxbox3:Documents/Projects/Proxy-Atelier/
ssh linuxbox3 'cd ~/Documents/Projects/Proxy-Atelier && export PATH="$HOME/.bun/bin:$HOME/.nvm/versions/node/v22.23.4/bin:$PATH" && bun install --frozen-lockfile && bun run verify'
rsync -az linuxbox3:Documents/Projects/Proxy-Atelier/dist/ ./dist/
```

With the bundled HTML present, the Xcode-only Mac build runs through the shared build guard:

```sh
./script/build_and_run.sh --verify
./script/build_and_run.sh --install
```

XcodeGen generates the native project from `native/project.yml`. The script generates the icon, builds with project-local `.build/DerivedData` (the guard may add a slot suffix) and stages the app in `.build/AppProducts`, verifies the signature and opens the application bundle. `--install` copies it into `~/Applications/Proxy Atelier.app`. A previous installed build is copied into `.build/Previous Proxy Atelier.app` before replacement. This process stops only Proxy Atelier if it was already running. It does not touch CLIProxyAPI or the Safari **Proxy Control** fallback.

## License and origin

MIT; upstream copyright and license are retained in the repository and app. Upstream base: `4e4aeff23f9f82b3ccdbe48b2e774d5dc918234e`. All original backend API contracts and proxy behavior remain unchanged. This is a management frontend fork and desktop host, not a fork of the inference engine.

## Account names and original controls

Click the pencil beside an account name in the overview or Accounts screen. Names are stored as local application preferences, keyed by provider plus account email (or filename when an email is unavailable), so the same subscription uses the same label in both host views. Clearing the field restores its default label. Provider tokens, credential filenames, routing priorities and sign-ins are unchanged. Labels also appear on the original account and quota cards.

**Open original dashboard** under Advanced opens the untouched upstream dashboard and navigation inside this app. Refresh All, language, theme, logout, Quick Start, provider editors, credential upload/download/refresh/enable/disable, OAuth, routing, detailed quota/reset actions, configuration, plugins, logs and system controls retain their original implementations. **Back to Atelier** returns to the redesigned view. Native View menu shortcuts: ⌘1 returns to Atelier, ⌘2 opens Original Controls, ⌘R refreshes observations.

The original `MainLayout.tsx` and `DashboardPage.tsx` are unchanged from the upstream base. The native Axios adapter preserves status/error handling, JSON, multipart uploads and binary downloads. Model discovery uses the same native channel. No destructive management action is executed during verification.

## Verification — 2026-10-30

- Full frontend verification on LinuxBox3: 1,882 tests passed, zero failures; ESLint passed without warnings; TypeScript and single-file Vite build passed.
- Two upstream test expectations were corrected: a translated tooltip is HTML-escaped in rendered markup, and the account card now renders its optional display name before its original identity. No runtime cooldown behavior changed.
- Native Xcode Release build and ad hoc signature validation passed; the local-network ATS exception is scoped to this app.
- Live UI checks covered both host connections, account quotas, 12 optimization checks, the original dashboard/Refresh All/model discovery, and saving account labels in native preferences.
- Before/after probes on MacBook and LinuxBox2 confirmed identical proxy engine hashes and process IDs, four active accounts, and the configured routing/transport settings. No proxy restart, engine replacement, T3 provider switch, account toggle or token copy was performed.
- The fork workflows use the required Linux self-hosted runner labels. No new runner is registered and no GitHub release or proxy deployment is triggered by the desktop installation.

## Daily-view simplification — 2026-10-30

The daily sidebar now has three labeled destinations. The large account count and repeated status graphic are replaced by a quota-first account table and one Ready / Needs attention link to the full checks. The host selector is labeled Viewing, with a management-only explanation. Supporting labels are larger; the ink, muted, subtle and accent text colors measure 15.91:1, 5.95:1, 4.83:1 and 7.66:1 against white. Reset countdowns update locally and say Checking reset after the observed time passes, rather than claiming refreshed quota. The complete original controls and all existing routes remain available through Advanced.
