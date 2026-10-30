import AppKit
import WebKit

final class AtelierWindowController: NSWindowController, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    private var webView: WKWebView!
    private var bridge: ProxyBridge!
    private let page = Bundle.main.url(forResource: "index", withExtension: "html")!

    init() {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1380, height: 940),
                              styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Proxy Atelier"
        window.minSize = NSSize(width: 960, height: 700)
        window.backgroundColor = .white
        window.appearance = NSAppearance(named: .aqua)
        window.titlebarAppearsTransparent = true
        window.isReleasedWhenClosed = false
        window.setFrameAutosaveName("ProxyAtelierMain")
        super.init(window: window)
        bridge = ProxyBridge()
        bridge.onSwitchHost = { [weak self] in self?.loadPage() }
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.addScriptMessageHandler(bridge, contentWorld: .page, name: "transport")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        window.contentView = webView
        window.center()
        loadPage()
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    private func loadPage() {
        let names = UserDefaults.standard.dictionary(forKey: "accountDisplayNames") as? [String: String] ?? [:]
        let nameData = (try? JSONSerialization.data(withJSONObject: names)) ?? Data("{}".utf8)
        let nameJSON = String(data: nameData, encoding: .utf8) ?? "{}"
        let script = """
        window.proxyAtelier = Object.freeze({
          host: '\(bridge.host)',
          accountNames: \(nameJSON),
          renameAccount: (identity, value) => window.webkit.messageHandlers.transport.postMessage({action:'renameAccount', identity, value}),
          request: payload => window.webkit.messageHandlers.transport.postMessage({action:'request', ...payload}),
          switchHost: host => window.webkit.messageHandlers.transport.postMessage({action:'switchHost', host})
        });
        """
        webView.configuration.userContentController.removeAllUserScripts()
        webView.configuration.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }
    func refresh() { webView.evaluateJavaScript("window.dispatchEvent(new Event('atelier-refresh'))", completionHandler: nil) }
    func navigate(_ path: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [path]), let encoded = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.location.hash = \(encoded)[0]", completionHandler: nil)
    }
    func switchInterface(original: Bool) {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('atelier-interface', { detail: \(original ? "true" : "false") }))", completionHandler: nil)
    }
    private func external(_ url: URL) {
        if ["https", "http"].contains(url.scheme?.lowercased() ?? "") { NSWorkspace.shared.open(url) }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if navigationAction.shouldPerformDownload { decisionHandler(.download); return }
        if url.isFileURL && url.standardizedFileURL.path == page.standardizedFileURL.path { decisionHandler(.allow) }
        else { external(url); decisionHandler(.cancel) }
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { external(url) }; return nil
    }
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel(); panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = parameters.allowsDirectories
        panel.beginSheetModal(for: window!) { completionHandler($0 == .OK ? panel.urls : nil) }
    }
    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let panel = NSSavePanel(); panel.nameFieldStringValue = suggestedFilename
        panel.beginSheetModal(for: window!) { completionHandler($0 == .OK ? panel.url : nil) }
    }
}
