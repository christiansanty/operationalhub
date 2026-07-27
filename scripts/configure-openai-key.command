#!/bin/zsh

set -euo pipefail

script_dir="${0:A:h}"
project_dir="${script_dir:h}"
env_file="${project_dir}/.env.local"
temp_file="${env_file}.tmp.$$"
api_key=""

restore_terminal() {
  stty echo < /dev/tty 2>/dev/null || true
  unset api_key
}

trap restore_terminal EXIT INT TERM HUP

print "Operational Hub — OpenAI configuration"
print ""
print "Paste a NEW, rotated OpenAI API key below."
print "The key will remain hidden and will not be added to Terminal history."
print -n "OpenAI API key: "
stty -echo < /dev/tty
IFS= read -r api_key < /dev/tty
stty echo < /dev/tty
print ""

if [[ "${api_key}" != sk-* ]] || (( ${#api_key} < 24 )); then
  print "Invalid key format. No file was changed."
  print -n "Press Return to close..."
  IFS= read -r < /dev/tty
  exit 1
fi

: > "${temp_file}"
chmod 600 "${temp_file}"

found_key=false
found_base=false

if [[ -f "${env_file}" ]]; then
  while IFS= read -r line || [[ -n "${line}" ]]; do
    case "${line}" in
      OPENAI_API_KEY=*)
        print -r -- "OPENAI_API_KEY=${api_key}" >> "${temp_file}"
        found_key=true
        ;;
      OPENAI_BASE_URL=*)
        print -r -- "OPENAI_BASE_URL=https://api.openai.com/v1" >> "${temp_file}"
        found_base=true
        ;;
      *)
        print -r -- "${line}" >> "${temp_file}"
        ;;
    esac
  done < "${env_file}"
fi

if [[ "${found_key}" != true ]]; then
  print -r -- "OPENAI_API_KEY=${api_key}" >> "${temp_file}"
fi

if [[ "${found_base}" != true ]]; then
  print -r -- "OPENAI_BASE_URL=https://api.openai.com/v1" >> "${temp_file}"
fi

mv "${temp_file}" "${env_file}"
chmod 600 "${env_file}"
unset api_key

print "Configuration saved securely in .env.local."
print "Return to Codex and reply: listo"
print -n "Press Return to close..."
IFS= read -r < /dev/tty
