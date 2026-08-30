#!/usr/bin/env python3
"""Read-only local bridge for World Blueprint.
No signing key is required or read. No write endpoints exist.
Usage:
  python live-bridge/bridge.py --root "/path/to/開発アプリ保管庫" --port 8787
Then open the demo and connect to http://<PC-IP>:8787/state on the same LAN.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse, json

ap=argparse.ArgumentParser(); ap.add_argument('--root',required=True); ap.add_argument('--port',type=int,default=8787); a=ap.parse_args()
root=Path(a.root).resolve()
STATUS=root/'tools/auto/log/phantom-status.json'; HEART=root/'tools/auto/log/phantom-heartbeat.json'; WORLD=root/'tools/auto/log/worldline-experiences.jsonl'

def load():
    s=json.loads(STATUS.read_text(encoding='utf-8')) if STATUS.exists() else {}
    h=json.loads(HEART.read_text(encoding='utf-8')) if HEART.exists() else {}
    last={}
    if WORLD.exists():
        for line in WORLD.read_text(encoding='utf-8').splitlines():
            if line.strip(): last=json.loads(line)
    gens=s.get('generations') or []; g=gens[-1] if gens else {}
    return {'state':s.get('state') or h.get('state'),'heartbeatAt':s.get('heartbeatAt') or h.get('heartbeatAt'),'generationEnd':s.get('generationEnd') or g.get('generation'),'population':g.get('population'),'bred':g.get('bred'),'genomes':g.get('genomes'),'novelty':g.get('novelty'),'learningScore':g.get('learningScore'),'inheritanceEvents':s.get('inheritanceEvents'),'worldline':{'branches':last.get('branches'),'outcomes':last.get('outcomes'),'productionAuthorized':last.get('productionAuthorized'),'authorityTransferred':last.get('authorityTransferred')},'readOnly':True}
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ('/state','/state/'):
            self.send_response(404); self.end_headers(); return
        raw=json.dumps(load(),ensure_ascii=False).encode()
        self.send_response(200); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def log_message(self,*args): pass
print(f'Read-only bridge: http://0.0.0.0:{a.port}/state')
ThreadingHTTPServer(('0.0.0.0',a.port),H).serve_forever()
