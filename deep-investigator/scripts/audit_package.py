#!/usr/bin/env python3
"""
audit_package.py - Herramienta ligera de auditoria de salud de repositorios y paquetes.
Sin dependencias externas (utiliza la libreria estandar de Python).
"""

import sys
import json
import re
import argparse
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

USER_AGENT = "DeepInvestigator-AuditBot/1.0"

def get_json(url: str, headers: dict = None):
    req_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    req = Request(url, headers=req_headers)
    try:
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.getcode()
    except HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}, e.code
    except URLError as e:
        return {"error": f"Network error: {e.reason}"}, 0
    except Exception as e:
        return {"error": str(e)}, 0

def audit_github(repo_path: str):
    # repo_path: "owner/repo"
    clean_repo = re.sub(r"^https?://github\.com/", "", repo_path).strip("/")
    url = f"https://api.github.com/repos/{clean_repo}"
    data, code = get_json(url)
    if code != 200:
        return {"target": clean_repo, "ecosystem": "github", "status": "error", "details": data}

    last_push = data.get("pushed_at")
    days_since_push = None
    if last_push:
        push_dt = datetime.fromisoformat(last_push.replace("Z", "+00:00"))
        days_since_push = (datetime.now(timezone.utc) - push_dt).days

    archived = data.get("archived", False)
    disabled = data.get("disabled", False)
    open_issues = data.get("open_issues_count", 0)
    stars = data.get("stargazers_count", 0)
    forks = data.get("forks_count", 0)
    license_info = data.get("license")
    license_name = license_info.get("spdx_id") or license_info.get("name") if license_info else "None/Unknown"

    health = "Healthy"
    warnings = []
    if archived:
        health = "ARCHIVED / DEPRECATED"
        warnings.append("El repositorio esta marcado como ARCHIVADO en GitHub.")
    elif days_since_push and days_since_push > 365:
        health = "Stale / Abandoned"
        warnings.append(f"Inactivo: Ultimo commit hace {days_since_push} dias (> 1 ano).")
    elif days_since_push and days_since_push > 180:
        warnings.append(f"Alerta de mantenimiento: Ultimo commit hace {days_since_push} dias.")

    if not license_info:
        warnings.append("No se detecto licencia explicita en el repositorio.")

    return {
        "target": clean_repo,
        "ecosystem": "github",
        "health": health,
        "stars": stars,
        "forks": forks,
        "open_issues_and_prs": open_issues,
        "last_push": last_push,
        "days_since_push": days_since_push,
        "is_archived": archived,
        "license": license_name,
        "warnings": warnings,
        "url": data.get("html_url")
    }

def audit_npm(package_name: str):
    url = f"https://registry.npmjs.org/{package_name}"
    data, code = get_json(url)
    if code != 200:
        return {"target": package_name, "ecosystem": "npm", "status": "error", "details": data}

    time_meta = data.get("time", {})
    modified = time_meta.get("modified")
    days_since_modified = None
    if modified:
        mod_dt = datetime.fromisoformat(modified.replace("Z", "+00:00"))
        days_since_modified = (datetime.now(timezone.utc) - mod_dt).days

    latest_ver = data.get("dist-tags", {}).get("latest", "unknown")
    latest_data = data.get("versions", {}).get(latest_ver, {})
    license_name = latest_data.get("license") or data.get("license", "Unknown")
    deprecated = latest_data.get("deprecated", False)

    warnings = []
    health = "Healthy"
    if deprecated:
        health = "DEPRECATED"
        warnings.append(f"Deprecado por el autor: {deprecated}")
    elif days_since_modified and days_since_modified > 365:
        health = "Stale"
        warnings.append(f"Ultima actualizacion hace {days_since_modified} dias.")

    return {
        "target": package_name,
        "ecosystem": "npm",
        "health": health,
        "latest_version": latest_ver,
        "last_modified": modified,
        "days_since_update": days_since_modified,
        "license": license_name,
        "is_deprecated": bool(deprecated),
        "warnings": warnings,
        "url": f"https://www.npmjs.com/package/{package_name}"
    }

def audit_pypi(package_name: str):
    url = f"https://pypi.org/pypi/{package_name}/json"
    data, code = get_json(url)
    if code != 200:
        return {"target": package_name, "ecosystem": "pypi", "status": "error", "details": data}

    info = data.get("info", {})
    releases = data.get("releases", {})
    latest_ver = info.get("version", "unknown")
    files = releases.get(latest_ver, [])
    upload_time = files[0].get("upload_time_iso_8601") if files else None

    days_since_upload = None
    if upload_time:
        up_dt = datetime.fromisoformat(upload_time.replace("Z", "+00:00"))
        days_since_upload = (datetime.now(timezone.utc) - up_dt).days

    license_name = info.get("license") or "Unknown"
    warnings = []
    health = "Healthy"
    if days_since_upload and days_since_upload > 365:
        health = "Stale"
        warnings.append(f"Ultimo release hace {days_since_upload} dias.")

    return {
        "target": package_name,
        "ecosystem": "pypi",
        "health": health,
        "latest_version": latest_ver,
        "last_release": upload_time,
        "days_since_release": days_since_upload,
        "license": license_name,
        "warnings": warnings,
        "url": info.get("project_url") or f"https://pypi.org/project/{package_name}/"
    }

def main():
    parser = argparse.ArgumentParser(description="Auditor rapido de salud de paquetes y repositorios.")
    parser.add_argument("target", help="Nombre del paquete o ruta de GitHub (ej: owner/repo o express o fastapi)")
    parser.add_argument("--ecosystem", choices=["github", "npm", "pypi", "auto"], default="auto",
                        help="Ecosistema objetivo (por defecto: auto-deteccion)")
    parser.add_argument("--format", choices=["json", "summary"], default="summary",
                        help="Formato de salida")

    args = parser.parse_args()
    target = args.target.strip()
    eco = args.ecosystem

    if eco == "auto":
        if "github.com" in target or "/" in target:
            eco = "github"
        else:
            eco = "npm"

    if eco == "github":
        res = audit_github(target)
    elif eco == "npm":
        res = audit_npm(target)
    elif eco == "pypi":
        res = audit_pypi(target)
    else:
        res = {"error": f"Ecosistema {eco} no soportado."}

    if args.format == "json":
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        if res.get("status") == "error":
            print(f"[ERROR] No se pudo auditar {res.get('target')}: {res.get('details', {}).get('error', 'Desconocido')}")
            sys.exit(1)

        print("=" * 60)
        print(f" AUDITORIA DE SALUD TECNICA: {res.get('target')} ({res.get('ecosystem').upper()})")
        print("=" * 60)
        print(f"• Estado de Salud    : {res.get('health')}")
        print(f"• Licencia           : {res.get('license')}")
        if "stars" in res:
            print(f"• Estrellas / Forks  : ⭐ {res.get('stars')} / 🍴 {res.get('forks')}")
            print(f"• Issues & PRs Open  : 📌 {res.get('open_issues_and_prs')}")
            print(f"• Ultimo Push        : {res.get('last_push')} ({res.get('days_since_push')} dias atras)")
        if "latest_version" in res:
            print(f"• Version Reciente   : v{res.get('latest_version')}")
        print(f"• Enlace Oficial     : {res.get('url')}")

        warnings = res.get("warnings", [])
        if warnings:
            print("\n⚠️ ALERTAS DETECTADAS:")
            for w in warnings:
                print(f"  - {w}")
        else:
            print("\n✅ Sin alertas criticas de mantenimiento detectadas.")
        print("=" * 60)

if __name__ == "__main__":
    main()
