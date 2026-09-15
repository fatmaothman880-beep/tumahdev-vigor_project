"""Manage an optional project-local PostgreSQL instance using installed binaries.
Existing .env files are never overwritten. Passwords are generated, not printed.
"""
import argparse
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / '.local' / 'postgres'

def binary(name):
    configured = os.environ.get('POSTGRES_BIN')
    if configured:
        candidate = Path(configured) / (name + '.exe')
        if candidate.exists():
            return str(candidate)
    found = shutil.which(name)
    if found:
        return found
    versions = list(Path(os.environ.get('ProgramFiles', 'C:/Program Files')).glob(f'PostgreSQL/*/bin/{name}.exe'))
    versions.sort(key=lambda p: tuple(int(n) for n in p.parents[1].name.split('.') if n.isdigit()), reverse=True)
    if not versions:
        raise SystemExit(f'{name} not found. Install PostgreSQL or set POSTGRES_BIN.')
    return str(versions[0])

def run(name, *args):
    subprocess.run([binary(name), *map(str, args)], check=True)

def start():
    if not DATA.exists():
        return  # .env may point to a separately managed PostgreSQL service.
    status = subprocess.run([binary('pg_ctl'), '-D', str(DATA), 'status'], capture_output=True)
    if status.returncode == 0:
        return
    run('pg_ctl', '-D', DATA, '-l', ROOT / '.local' / 'postgres.log', '-w', 'start')

def setup():
    if (ROOT / '.env').exists() or DATA.exists():
        raise SystemExit('Existing .env or local database found. Kept unchanged; configure it manually or run start.')
    ROOT.joinpath('.local').mkdir(exist_ok=True)
    password = secrets.token_hex(24)
    password_file = ROOT / '.local' / 'init-password.tmp'
    try:
        password_file.write_text(password, encoding='utf-8')
        run('initdb', '-D', DATA, '-U', 'vigor_user', '--auth=scram-sha-256', '--encoding=UTF8', '--pwfile', password_file)
    finally:
        password_file.unlink(missing_ok=True)
    with (DATA / 'postgresql.conf').open('a', encoding='utf-8') as config:
        config.write("\n# VIGOR local development instance\nlisten_addresses = '127.0.0.1'\nport = 55432\n")
    config = (ROOT / '.env.example').read_text(encoding='utf-8-sig')
    config = config.replace('vigor_user:REPLACE_ME@127.0.0.1:5432/vigor_port', f'vigor_user:{password}@127.0.0.1:55432/vigor_port')
    config = config.replace('AUTH_SECRET=\n', 'AUTH_SECRET=' + secrets.token_hex(32) + '\n')
    with (ROOT / '.env').open('x', encoding='utf-8') as target:
        target.write(config)
    start()
    import psycopg
    with psycopg.connect(host='127.0.0.1', port=55432, user='vigor_user', password=password, dbname='postgres', autocommit=True) as connection:
        connection.execute('CREATE DATABASE vigor_port')
        connection.execute('CREATE DATABASE vigor_port_test')
    print('Local PostgreSQL ready on port 55432. Configuration saved to ignored .env.')
    print('Run scripts/start-environment.ps1 -Seed next.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['setup', 'start', 'stop'])
    args = parser.parse_args()
    if args.action == 'setup':
        setup()
    elif args.action == 'start':
        start()
    elif DATA.exists():
        run('pg_ctl', '-D', DATA, '-m', 'fast', '-w', 'stop')
