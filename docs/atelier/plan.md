# Implementation plan

1. Record safe before-state for both running proxies and verify transcript settings.
2. Add a credential-free native Axios adapter with binary/multipart support, timeout cleanup, and existing response-event behavior.
3. Build the redesigned shell and live dashboard using existing auth/config/quota APIs. Retain management routes and add a dedicated verified-settings view. Add localized labels in all seven catalogs.
4. Add an AppKit/WKWebView host with native transport, restricted navigation, host selection, and refresh/menu shortcuts. Use existing SSH for LinuxBox2; no token copying.
5. Test adapter and settings/usage logic on LinuxBox3, run the repository verify command, and build a single bundled HTML resource.
6. Build with Xcode, sign the app, inspect it through accessibility and screenshots, correct visual/interaction issues, install in ~/Applications, and open the installed copy.
7. Verify unchanged proxy engine/process identities, both hosts' settings and the helper; push the implementation branch, open a ready PR, and record evidence in Linear and the vault.

## Approved simplification — 2026-10-30

1. Replace the icon rail with three labeled destinations. Add an Advanced index linking to every existing route and the untouched Original controls interface.
2. Make the account table the primary surface: preserve names/order/filtering, show weekly and short-window allowance, and add relative reset times with the exact timestamp available.
3. Present a single setup-health indicator. Preserve all twelve detailed checks under its link and distinguish loading, unknown readings and failed connections.
4. Label host selection as Viewing and explain its management-only effect.
5. Increase supporting text size and contrast while preserving the reference palette. Run logic/contrast tests, full frontend verification on LinuxBox3, guarded Xcode build/install and live UI checks; verify both engine identities remain unchanged.
