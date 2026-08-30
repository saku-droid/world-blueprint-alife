# world-blueprint-alife

Public, keyless interactive architecture map for the experimental ALife / cognitive-evolution project.

## Modes
- **SNAPSHOT / DEMO** — uses only sanitized facts extracted from the supplied real files.
- **LIVE LOCAL** — optional read-only bridge to local `phantom-status.json`, `phantom-heartbeat.json`, and `worldline-experiences.jsonl`.

## Security boundary
- No private keys are included.
- No production write endpoint exists.
- Founder/personality origin is not included.
- `LIVE LOCAL` only exposes an allowlisted summary of runtime logs.

## GitHub Pages
Push this folder to a dedicated repository. The included workflow deploys the static site from the repository root.

## Local live bridge
```bash
python live-bridge/bridge.py --root "/path/to/開発アプリ保管庫" --port 8787
```
Open the site, choose **LIVE LOCAL**, enter `http://<PC-IP>:8787/state`, and connect. For phones, PC and phone must be on the same network and the OS firewall must allow the chosen port.

## Evidence
`data/verified-facts.json` records the sanitized snapshot and source paths used by the UI.
