#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

check=${check:-staged-changes}

case "$check" in
  all)
    git_command=(git ls-files -z)
    ;;
  staged-changes)
    git_command=(git diff --diff-filter=ACMRT --name-only --cached -z)
    ;;
  working-tree-changes)
    git_command=(git diff --diff-filter=ACMRT --name-only -z)
    ;;
  branch)
    git_command=(git diff --diff-filter=ACMRT --name-only -z "${BRANCH_NAME:-origin/main}")
    ;;
  *)
    echo "Unrecognised check mode: $check" >&2
    exit 1
    ;;
esac

files=()
while IFS= read -r -d '' file; do
  [[ -f "$file" ]] || continue
  [[ "$file" =~ \.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$ ]] || continue
  files+=("$file")
done < <("${git_command[@]}")

if [[ ${#files[@]} -eq 0 ]]; then
  exit 0
fi

./node_modules/.bin/eslint --fix -- "${files[@]}"

if [[ "$check" == "staged-changes" ]]; then
  git add -- "${files[@]}"
fi
