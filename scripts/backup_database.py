"""Back up local PostgreSQL without shell interpolation or passwords in arguments."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.engine import make_url

root = Path(__file__).resolve().parents[1]
load_dotenv(root / '.env')
url = make_url(os.environ['DATABASE_URL'])
if url.get_backend_name() != 'postgresql':
    raise SystemExit('DATABASE_URL must point to PostgreSQL.')
dump = shutil.which('pg_dump')
if not dump:
    installations = list(Path(os.environ.get('ProgramFiles', 'C:/Program Files')).glob('PostgreSQL/*/bin/pg_dump.exe'))
    installations.sort(key=lambda p: tuple(int(n) for n in p.parents[1].name.split('.') if n.isdigit()), reverse=True)
    dump = str(installations[0]) if installations else None
if not dump:
    raise SystemExit('pg_dump not found. Add PostgreSQL bin to PATH.')
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'artifacts' / 'backups' / f"vigor-{datetime.now():%Y%m%d-%H%M%S}.dump"
output.parent.mkdir(parents=True, exist_ok=True)
if output.exists():
    raise SystemExit('Backup path already exists; choose a new filename.')
env = os.environ.copy()
env.update(PGHOST=url.host or '127.0.0.1', PGPORT=str(url.port or 5432), PGUSER=url.username or '', PGPASSWORD=url.password or '', PGDATABASE=url.database or '')
try:
    subprocess.run([dump, '--no-password', '--format=custom', '--no-owner', '--no-privileges', '--file', str(output)], env=env, check=True)
except subprocess.CalledProcessError:
    output.unlink(missing_ok=True)
    raise SystemExit('pg_dump failed; incomplete output removed.')
print(output)
