# Implementation plan

1. Record safe before-state for both running proxies and verify transcript settings.
2. Add a credential-free native Axios adapter with binary/multipart support, timeout cleanup, and existing response-event behavior.
3. Build the redesigned shell and live dashboard using existing auth/config/quota APIs. Retain management routes and add a dedicated verified-settings view. Add localized labels in all seven catalogs.
4. Add an AppKit/WKWebView host with native transport, restricted navigation, host selection, and refresh/menu shortcuts. Use existing SSH for LinuxBox2; no token copying.
5. Test adapter and settings/usage logic on LinuxBox3, run the repository verify command, and build a single bundled HTML resource.
6. Build with Xcode, sign the app, inspect it through accessibility and screenshots, correct visual/interaction issues, install in ~/Applications, and open the installed copy.
7. Verify unchanged proxy engine/process identities, both hosts' settings and the helper; push the implementation branch, open a ready PR, and record evidence in Linear and the vault.
