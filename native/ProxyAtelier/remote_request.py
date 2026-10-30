"""Runs over existing SSH; the management key stays on the selected proxy host."""
import base64
import datetime
import json
import pathlib
import subprocess
import sys
import urllib.error
import urllib.request


def response(status, headers, body):
    return {"status": status, "headers": headers, "body": base64.b64encode(body).decode()}


def main():
    payload = json.load(sys.stdin)
    path = payload["path"]
    method = payload["method"]
    if not (path.startswith("/v8/management/") or (path == "/v1/models" and method == "GET")) or "://" in path or ".." in path:
        raise ValueError("invalid request")
    if method not in ("GET", "POST", "PUT", "PATCH", "DELETE"):
        raise ValueError("invalid method")
    if path == "/v8/management/atelier/status" and method == "GET":
        enabled = subprocess.run(["systemctl", "--user", "is-active", "--quiet", "cliproxy-priority.timer"]).returncode == 0
        journal = subprocess.run(["journalctl", "--user", "-u", "cliproxy-priority.service", "-n", "30", "-o", "json", "--no-pager"], capture_output=True, text=True, timeout=5)
        last_run = last_status = None
        for line in journal.stdout.splitlines():
            try:
                entry = json.loads(line)
                summary = json.loads(entry.get("MESSAGE", ""))
                if "status" in summary:
                    last_status = summary["status"]
                    last_run = datetime.datetime.fromtimestamp(int(entry["__REALTIME_TIMESTAMP"]) / 1e6, datetime.timezone.utc).isoformat()
            except (ValueError, KeyError, TypeError):
                continue
        return response(200, {"content-type": "application/json"}, json.dumps({"enabled": enabled, "lastRun": last_run, "lastStatus": last_status}).encode())
    keys = json.loads((pathlib.Path.home() / ".config/cliproxyapi/client-keys.json").read_text())
    headers = {name: value for name, value in payload.get("headers", {}).items() if name.lower() in ("content-type", "accept")}
    headers["Authorization"] = "Bearer " + keys["proxy_api_key" if path == "/v1/models" else "management_api_key"]
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args):
            return None
    request = urllib.request.Request("http://127.0.0.1:8317" + path, data=base64.b64decode(payload["body"]) if payload.get("body") else None, headers=headers, method=method)
    try:
        result = urllib.request.build_opener(NoRedirect).open(request, timeout=60)
    except urllib.error.HTTPError as error:
        result = error
    with result:
        return response(result.status, {name.lower(): value for name, value in result.headers.items()}, result.read())


if __name__ == "__main__":
    try:
        print(json.dumps(main()))
    except Exception:
        sys.exit(1)
