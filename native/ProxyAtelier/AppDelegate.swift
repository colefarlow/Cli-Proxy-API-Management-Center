import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var controller: AtelierWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let main = NSMenu()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Proxy Atelier", action: #selector(about), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide Proxy Atelier", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit Proxy Atelier", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let appItem = NSMenuItem(); appItem.submenu = appMenu; main.addItem(appItem)
        let edit = NSMenu(title: "Edit")
        for (title, action, key) in [("Undo", Selector(("undo:")), "z"), ("Cut", #selector(NSText.cut(_:)), "x"), ("Copy", #selector(NSText.copy(_:)), "c"), ("Paste", #selector(NSText.paste(_:)), "v"), ("Select All", #selector(NSText.selectAll(_:)), "a")] {
            edit.addItem(withTitle: title, action: action, keyEquivalent: key)
        }
        let editItem = NSMenuItem(); editItem.submenu = edit; main.addItem(editItem)
        let view = NSMenu(title: "View")
        view.addItem(withTitle: "Refresh Observations", action: #selector(refresh), keyEquivalent: "r")
        view.addItem(withTitle: "Dashboard", action: #selector(dashboard), keyEquivalent: "1")
        view.addItem(withTitle: "Original Controls", action: #selector(originalControls), keyEquivalent: "2")
        view.addItem(withTitle: "Optimizations", action: #selector(optimizations), keyEquivalent: ",")
        let viewItem = NSMenuItem(); viewItem.submenu = view; main.addItem(viewItem)
        NSApp.mainMenu = main
        controller = AtelierWindowController()
        controller?.showWindow(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        controller?.showWindow(nil); return true
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
    @objc private func refresh() { controller?.refresh() }
    @objc private func dashboard() { controller?.switchInterface(original: false); controller?.navigate("/") }
    @objc private func originalControls() { controller?.switchInterface(original: true) }
    @objc private func optimizations() { controller?.navigate("/setup") }
    @objc private func about() {
        NSApp.orderFrontStandardAboutPanel(options: [
            .applicationName: "Proxy Atelier",
            .applicationVersion: "1.0",
            .credits: NSAttributedString(string: "A personal desktop fork of CLI Proxy API Management Center.\nMIT licensed. Proxy engine runs independently.\nrouter-for-me and contributors · Cole Farlow")
        ])
    }
}
