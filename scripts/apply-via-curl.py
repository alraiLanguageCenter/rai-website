"""One-shot Supabase Management-API runner that reports actual error bodies.
Usage:
  python scripts/apply-via-curl.py supabase/migrations/<file>.sql
"""
from __future__ import annotations
import json, os, sys, urllib.request, urllib.error

PAT = os.environ.get('SUPABASE_PAT') # (PAT comes from SUPABASE_PAT env var)
PROJECT_REF = os.environ.get('SUPABASE_REF') or 'hoqtyaebrfcsjlwbonts'
URL = f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query'


def run(sql: str, label: str) -> bool:
    body = json.dumps({'query': sql}).encode('utf-8')
    req = urllib.request.Request(
        URL, data=body, method='POST',
        headers={
            'Authorization': f'Bearer {PAT}',
            'Content-Type': 'application/json',
            'User-Agent': 'rai-migration-runner',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read().decode('utf-8', errors='replace')
            print(f'  OK   {label} ({len(sql)} chars) → {data[:160]}')
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        print(f'  FAIL {label} ({len(sql)} chars) HTTP {e.code}\n       {err_body[:500]}')
        return False
    except Exception as e:
        print(f'  FAIL {label} ({len(sql)} chars) {e}')
        return False


def split_into_batches(sql: str, soft_cap: int = 5800) -> list[str]:
    """Split on blank-line boundaries, re-pack into batches under the cap."""
    paragraphs = [p.strip() for p in sql.split('\n\n') if p.strip()]
    out: list[str] = []
    cur = ''
    for p in paragraphs:
        if cur and len(cur) + len(p) + 2 > soft_cap:
            out.append(cur)
            cur = ''
        cur = (cur + '\n\n' + p) if cur else p
    if cur:
        out.append(cur)
    return out


def main():
    if len(sys.argv) < 2:
        print('usage: apply-via-curl.py <file.sql>')
        sys.exit(2)
    path = sys.argv[1]
    with open(path, encoding='utf-8') as f:
        sql = f.read()
    batches = split_into_batches(sql)
    print(f'Source {len(sql)} chars → {len(batches)} batches')
    ok = fail = 0
    for i, b in enumerate(batches, 1):
        if run(b, f'batch {i}/{len(batches)}'):
            ok += 1
        else:
            fail += 1
    print(f'Done: {ok} ok, {fail} failed')
    sys.exit(0 if fail == 0 else 1)


if __name__ == '__main__':
    main()
