import io, os, json, subprocess, urllib.request, urllib.error

TOKEN_PATH = r'C:\Users\binma\.github\token'
REPO_NAME = 'tron-ares'

with io.open(TOKEN_PATH, 'r', encoding='utf-8') as f:
    token = f.read().strip()

def api(method, url, payload=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', 'token ' + token)
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('User-Agent', 'hermes-agent')
    data = None
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, data=data, timeout=30) as r:
            return r.status, json.loads(r.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8') or '{}')

# who am I
st, me = api('GET', 'https://api.github.com/user')
print('user:', st, me.get('login'))
owner = me.get('login')

# create the private repo (idempotent)
st, repo = api('POST', 'https://api.github.com/user/repos', {
    'name': REPO_NAME,
    'private': True,
    'description': 'TRON: ARES - PROTOCOL OVERRIDE. 9-vehicle transformable grid combat simulator (Three.js + Vite).',
    'auto_init': False,
})
if st == 201:
    print('repo created:', repo.get('html_url'))
elif st == 422:
    print('repo already exists')
else:
    print('repo create status:', st, repo.get('message'))

# write .gitignore
gitignore = """node_modules/
dist/
.vite/
*.log
_screenshots/
_backup/
"""
io.open('E:/Tron ares/.gitignore', 'w', encoding='utf-8').write(gitignore)

def run(cmd, cwd='E:/Tron ares'):
    p = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    out = (p.stdout or '') + (p.stderr or '')
    print('$', cmd, '->', p.returncode, out.strip()[:400])
    return p.returncode

run('git init')
run('git config user.email "masudsadman0@gmail.com"')
run('git config user.name "MdSadman20040812"')
run('git add -A')
run('git commit -m "TRON: Ares - 9 vehicles (incl. Ares film fleet), 16-district grid, runways, crimson atmosphere"')
run('git branch -M main')

# push with the token embedded, then strip it back out
remote = 'https://%s:%s@github.com/%s/%s.git' % (owner, token, owner, REPO_NAME)
run('git remote remove origin')
run('git remote add origin ' + remote)
rc = run('git push -u origin main --force')
run('git remote set-url origin https://github.com/%s/%s.git' % (owner, REPO_NAME))
print('PUSH RC', rc)
print('files tracked:', subprocess.run('git ls-files | wc -l', cwd='E:/Tron ares', shell=True, capture_output=True, text=True).stdout.strip())
