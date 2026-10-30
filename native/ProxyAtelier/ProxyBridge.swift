import AppKit
import WebKit

final class ProxyBridge: NSObject, WKScriptMessageHandlerWithReply, URLSessionTaskDelegate {
    private(set) var host: String = UserDefaults.standard.string(forKey: "selectedProxyHost") == "linuxbox2" ? "linuxbox2" : "macbook"
    var onSwitchHost: (() -> Void)?
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 300
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              let payload = message.body as? [String: Any], let action = payload["action"] as? String else {
            replyHandler(nil, "Invalid desktop request"); return
        }
        if action == "switchHost" {
            guard let selection = payload["host"] as? String, ["macbook", "linuxbox2"].contains(selection) else { replyHandler(nil, "Unknown host"); return }
            host = selection; UserDefaults.standard.set(host, forKey: "selectedProxyHost")
            replyHandler(["ok": true], nil); onSwitchHost?(); return
        }
        if action == "renameAccount" {
            guard let identity = payload["identity"] as? String, identity.count <= 1024,
                  let value = payload["value"] as? String, value.count <= 60,
                  value.rangeOfCharacter(from: .controlCharacters) == nil else { replyHandler(nil, "Invalid display name"); return }
            var names = UserDefaults.standard.dictionary(forKey: "accountDisplayNames") as? [String: String] ?? [:]
            let name = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if name.isEmpty { names.removeValue(forKey: identity) } else { names[identity] = name }
            UserDefaults.standard.set(names, forKey: "accountDisplayNames")
            replyHandler(["ok": true], nil); return
        }
        guard action == "request", let path = payload["path"] as? String,
              !path.contains("://"), !path.contains(".."),
              (path.hasPrefix("/v8/management/") || (path == "/v1/models" && payload["method"] as? String == "GET")),
              let method = payload["method"] as? String,
              ["GET", "POST", "PUT", "PATCH", "DELETE"].contains(method) else { replyHandler(nil, "Unsupported management request"); return }
        if host == "linuxbox2" { remote(payload: payload, reply: replyHandler); return }
        if path == "/v8/management/atelier/status" && method == "GET" {
            helperStatus(reply: replyHandler); return
        }
        do {
            let keyFile = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".config/cliproxyapi/client-keys.json")
            let keys = try JSONSerialization.jsonObject(with: Data(contentsOf: keyFile)) as? [String: String]
            guard let key = keys?[path == "/v1/models" ? "proxy_api_key" : "management_api_key"], !key.isEmpty,
                  let url = URL(string: "http://127.0.0.1:8317" + path), url.host == "127.0.0.1" else { replyHandler(nil, "Local authentication unavailable"); return }
            var request = URLRequest(url: url); request.httpMethod = method
            request.setValue("Bearer " + key, forHTTPHeaderField: "Authorization")
            for (name, value) in payload["headers"] as? [String: String] ?? [:] where ["content-type", "accept"].contains(name.lowercased()) { request.setValue(value, forHTTPHeaderField: name) }
            if let body = payload["body"] as? String, !body.isEmpty { request.httpBody = Data(base64Encoded: body) }
            session.dataTask(with: request) { data, response, error in
                guard error == nil, let http = response as? HTTPURLResponse, let data = data else { DispatchQueue.main.async { replyHandler(nil, "Local proxy unavailable") }; return }
                let headers = http.allHeaderFields.reduce(into: [String: String]()) { result, entry in if let name = entry.key as? String { result[name.lowercased()] = String(describing: entry.value) } }
                DispatchQueue.main.async { replyHandler(["status": http.statusCode, "headers": headers, "body": data.base64EncodedString()], nil) }
            }.resume()
        } catch { replyHandler(nil, "Local authentication unavailable") }
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
    private func helperStatus(reply: @escaping (Any?, String?) -> Void) {
        DispatchQueue.global(qos: .utility).async {
            let file = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".config/cliproxyapi/priority-helper.log")
            let log = (try? String(contentsOf: file, encoding: .utf8)) ?? ""
            let summary = log.split(separator: "\n").reversed().compactMap { line -> [String: Any]? in guard let data = line.data(using: .utf8) else { return nil }; return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] }.first
            let modified = (try? FileManager.default.attributesOfItem(atPath: file.path)[.modificationDate]) as? Date
            let task = Process(); task.executableURL = URL(fileURLWithPath: "/bin/launchctl")
            task.arguments = ["print", "gui/\(getuid())/com.colefarlow.cliproxy-priority"]
            task.standardOutput = FileHandle.nullDevice; task.standardError = FileHandle.nullDevice
            let enabled: Bool
            do { try task.run(); task.waitUntilExit(); enabled = task.terminationStatus == 0 } catch { enabled = false }
            let result: [String: Any] = ["enabled": enabled, "lastRun": modified.map { ISO8601DateFormatter().string(from: $0) } as Any? ?? NSNull(), "lastStatus": summary?["status"] ?? NSNull()]
            self.respondJSON(result, reply: reply)
        }
    }
    private func respondJSON(_ result: [String: Any], reply: @escaping (Any?, String?) -> Void) {
        guard let data = try? JSONSerialization.data(withJSONObject: result) else { DispatchQueue.main.async { reply(nil, "Observation unavailable") }; return }
        DispatchQueue.main.async { reply(["status": 200, "headers": ["content-type": "application/json"], "body": data.base64EncodedString()], nil) }
    }
    private func remote(payload: [String: Any], reply: @escaping (Any?, String?) -> Void) {
        guard let scriptURL = Bundle.main.url(forResource: "remote_request", withExtension: "py"), let script = try? String(contentsOf: scriptURL, encoding: .utf8), let input = try? JSONSerialization.data(withJSONObject: payload) else { reply(nil, "Remote connection unavailable"); return }
        DispatchQueue.global(qos: .userInitiated).async {
            let task = Process(); task.executableURL = URL(fileURLWithPath: "/usr/bin/ssh")
            task.arguments = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=8", "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3", "linuxbox2", "python3 -c " + "'" + script.replacingOccurrences(of: "'", with: "'\\''") + "'"]
            let stdin = Pipe(), stdout = Pipe()
            task.standardInput = stdin; task.standardOutput = stdout; task.standardError = FileHandle.nullDevice
            do {
                try task.run(); stdin.fileHandleForWriting.write(input); try? stdin.fileHandleForWriting.close()
                let bytes = stdout.fileHandleForReading.readDataToEndOfFile(); task.waitUntilExit()
                guard task.terminationStatus == 0, let result = try JSONSerialization.jsonObject(with: bytes) as? [String: Any] else { DispatchQueue.main.async { reply(nil, "LinuxBox2 connection unavailable") }; return }
                DispatchQueue.main.async { reply(result, nil) }
            } catch { DispatchQueue.main.async { reply(nil, "LinuxBox2 connection unavailable") } }
        }
    }
}
