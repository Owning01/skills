#!/usr/bin/env python3
"""
inspect_reference_repo.py - Herramienta para clonar superficialmente repositorios de referencia,
buscar funciones/simbolos especificos y extraer su implementacion para analisis comparativo.
"""

import sys
import os
import shutil
import stat
import subprocess
import argparse
import json
import re
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def remove_readonly(func, path, excinfo):
    """Manejador para eliminar archivos de solo lectura en Windows (comun en .git)."""
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

def run_cmd(cmd, cwd=None):
    try:
        res = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return True, res.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except Exception as e:
        return False, str(e)

def clone_shallow(repo_url: str, target_dir: Path):
    if target_dir.exists():
        # Ya existe
        return True, "Directorio existente, reutilizando cache."
    
    target_dir.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["git", "clone", "--depth", "1", "--single-branch", repo_url, str(target_dir)]
    ok, out = run_cmd(cmd)
    return ok, out

def search_symbol_in_repo(repo_dir: Path, symbol: str, file_pattern: str = None, max_results: int = 5):
    results = []
    symbol_regex = re.compile(rf"(def\s+{re.escape(symbol)}|function\s+{re.escape(symbol)}|async\s+def\s+{re.escape(symbol)}|const\s+{re.escape(symbol)}\s*=|class\s+{re.escape(symbol)}|fn\s+{re.escape(symbol)}|func\s+{re.escape(symbol)}|\b{re.escape(symbol)}\s*\()", re.IGNORECASE)

    ignore_dirs = {".git", "node_modules", "vendor", "dist", "build", ".venv", "venv", "__pycache__"}

    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if file_pattern and not Path(file).match(file_pattern):
                continue
            
            # Filtrar binarios o archivos grandes
            file_path = Path(root) / file
            if file_path.stat().st_size > 1_500_000:
                continue

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                continue

            for idx, line in enumerate(lines):
                if symbol_regex.search(line):
                    # Capturar ventana de contexto (hasta 35 lineas)
                    start = max(0, idx - 2)
                    end = min(len(lines), idx + 35)
                    snippet = "".join(lines[start:end])
                    rel_path = str(file_path.relative_to(repo_dir))
                    results.append({
                        "file": rel_path,
                        "line_number": idx + 1,
                        "match_line": line.strip(),
                        "snippet": snippet
                    })
                    if len(results) >= max_results:
                        return results
    return results

def main():
    parser = argparse.ArgumentParser(description="Clonacion superficial e inspeccion de funciones en repositorios de referencia.")
    parser.add_argument("repo", help="URL del repositorio o formato 'owner/repo' (ej: expressjs/express o https://github.com/...)")
    parser.add_argument("--symbol", required=True, help="Nombre de la funcion, metodo o patron a buscar (ej: debounce, authenticate, handleRetry)")
    parser.add_argument("--filter", default=None, help="Filtro de extension/nombre de archivo (ej: *.ts, *.py, *.dart)")
    parser.add_argument("--cache-dir", default=".deep_ref_cache", help="Carpeta temporal para descargar repositorios")
    parser.add_argument("--clean", action="store_true", help="Eliminar el repositorio tras la inspeccion")
    parser.add_argument("--json", action="store_true", help="Salida en formato JSON estructurado")

    args = parser.parse_args()

    repo = args.repo.strip()
    if not repo.startswith("http://") and not repo.startswith("https://"):
        repo_url = f"https://github.com/{repo}.git"
        repo_name = repo.replace("/", "_")
    else:
        repo_url = repo
        repo_name = repo.rstrip("/").split("/")[-1].replace(".git", "")

    cache_path = Path(args.cache_dir).resolve() / repo_name

    ok, msg = clone_shallow(repo_url, cache_path)
    if not ok:
        err = {"status": "error", "message": f"Fallo al clonar {repo_url}: {msg}"}
        if args.json:
            print(json.dumps(err, indent=2))
        else:
            print(f"[ERROR] {err['message']}")
        sys.exit(1)

    matches = search_symbol_in_repo(cache_path, args.symbol, args.filter)

    output = {
        "repo": repo_url,
        "symbol": args.symbol,
        "cached_in": str(cache_path),
        "total_matches": len(matches),
        "matches": matches
    }

    if args.json:
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        print("=" * 70)
        print(f" REPOSITORIO DE REFERENCIA: {repo_url}")
        print(f" SIMBOLO BUSCADO           : {args.symbol}")
        print(f" COINCIDENCIAS HALLADAS    : {len(matches)}")
        print("=" * 70)
        if not matches:
            print(f"No se encontraron definiciones exactas para '{args.symbol}' en el repositorio.")
        for i, m in enumerate(matches, 1):
            print(f"\n--- Coincidencia {i} en [{m['file']}:{m['line_number']}] ---")
            print(m["snippet"].rstrip())
            print("-" * 70)

    if args.clean:
        try:
            shutil.rmtree(cache_path, onerror=remove_readonly)
        except Exception as e:
            pass

if __name__ == "__main__":
    main()
