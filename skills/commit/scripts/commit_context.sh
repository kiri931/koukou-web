#!/usr/bin/env bash
set -euo pipefail

recent_count="${1:-20}"

echo "== RECENT SUBJECTS =="
git log --pretty=format:'- %s' -n "${recent_count}" || true
echo
echo

echo "== STATUS =="
git status --short || true
echo

echo "== STAGED STAT =="
git diff --cached --stat || true
echo

echo "== UNSTAGED STAT =="
git diff --stat || true
echo

echo "== STAGED FILES =="
git diff --cached --name-status || true
echo
