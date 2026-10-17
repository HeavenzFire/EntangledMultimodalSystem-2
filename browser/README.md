# HeavenzFire Sovereign Browser (prototype)

A small, local-only browser control service for agent workflows. It connects to an already-running Chromium/Chrome/Edge instance over Chrome DevTools Protocol (CDP), then exposes a narrow HTTP task API for approved navigation and UI actions.

## Security model

- Listens only on `127.0.0.1`.
- Requires a bearer token from `HF_BROWSER_TOKEN`.
- Requires an explicit comma-separated hostname allowlist in `HF_BROWSER_ALLOWED_HOSTS`.
- Allows HTTPS navigation only, to exact allowlisted hostnames.
- Supports only a small set of declared actions: navigate, click, fill, read title/text, screenshot.
- No arbitrary JavaScript evaluation, shell execution, file upload, credential extraction, or unrestricted URL navigation.
- Keep the token private. Do not commit it or paste it into chat.
- Treat webpage content as untrusted input. A page must not be allowed to redefine system policy or request secrets.

This is a prototype, not a production security boundary. Browser cookies and logged-in sessions are powerful credentials. Use a dedicated browser profile for agent automation rather than your everyday profile.

## Requirements

- Node.js 18+
- A Chromium-based browser already installed and launched with CDP enabled
- Install the small runtime dependency from this directory:

```powershell
npm install
```

Example: launch a dedicated Chrome profile with remote debugging enabled. Adjust the executable path if Chrome is installed elsewhere; this command uses a separate profile directory so it does not take over your everyday session.

```powershell
$Chrome = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $Chrome)) {
  $Chrome = Join-Path $env:ProgramFiles(x86) 'Google\Chrome\Application\chrome.exe'
}
$Profile = Join-Path $env:LOCALAPPDATA 'HeavenzFire\BrowserProfile'
New-Item -ItemType Directory -Force -Path $Profile | Out-Null
Start-Process -FilePath $Chrome -ArgumentList @(
  '--remote-debugging-port=9222',
  '--remote-debugging-address=127.0.0.1',
  "--user-data-dir=$Profile",
  '--no-first-run',
  '--no-default-browser-check'
)
```

Sign into the required sites manually in this dedicated profile. Never put passwords, API keys, or cookies in task payloads.

## Start the service (PowerShell)

```powershell
Set-Location .\browser
npm install
$env:HF_BROWSER_TOKEN = [guid]::NewGuid().ToString('N')
$env:HF_BROWSER_ALLOWED_HOSTS = 'aistudio.google.com,ai.studio,github.com'
$env:HF_BROWSER_CDP_URL = 'http://127.0.0.1:9222'
$env:HF_BROWSER_PORT = '8789'
npm start
```

Keep the token in the same trusted PowerShell session used to submit tasks. Do not expose port 8789 on the LAN.

## API

`GET http://127.0.0.1:8789/health` returns service state without exposing the token.

`POST http://127.0.0.1:8789/task` requires `Authorization: Bearer <token>` and JSON such as:

```json
{
  "actions": [
    { "type": "navigate", "url": "https://aistudio.google.com/" },
    { "type": "title" },
    { "type": "text", "selector": "body", "maxChars": 4000 }
  ]
}
```

Allowed action types: `navigate`, `click`, `fill`, `title`, `text`, `screenshot`. Maximum 12 actions per request. All actions have bounded timeouts. Screenshots are saved only to a configured local screenshot directory and the API returns the path.

## Tests

```powershell
npm test
```

Tests cover request validation and URL allowlisting without opening a browser. A passing unit test does not prove that CDP, a signed-in website, or any remote AI service is connected.

## Integration status

This service is not yet wired into the HeavenzFire Legion orchestrator or mycelium task router. First verify the local browser service independently; then add an authenticated, policy-checked worker adapter. Do not register a browser worker until the adapter is implemented and tested.
