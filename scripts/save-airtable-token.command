#!/bin/zsh

set -euo pipefail

project_dir="${0:A:h:h}"
env_file="$project_dir/.env.local"

token=$(/usr/bin/osascript <<'APPLESCRIPT'
try
  set response to display dialog "Pega tu Personal Access Token de Airtable. Se guardará únicamente en este equipo y el contenido permanecerá oculto." default answer "" with hidden answer buttons {"Cancelar", "Guardar token"} default button "Guardar token" cancel button "Cancelar" with title "Eastern Medical Academy · Airtable"
  return text returned of response
on error number -128
  return ""
end try
APPLESCRIPT
)

if [[ -z "$token" ]]; then
  /usr/bin/osascript -e 'display notification "No se guardó ningún token." with title "Eastern Medical Academy"'
  exit 0
fi

umask 077
temp_file=$(/usr/bin/mktemp "${TMPDIR:-/tmp}/eastern-airtable.XXXXXX")
trap '/bin/rm -f "$temp_file"' EXIT

/usr/bin/printf 'AIRTABLE_PERSONAL_ACCESS_TOKEN=%s\n' "$token" > "$temp_file"
/bin/mv "$temp_file" "$env_file"
/bin/chmod 600 "$env_file"
token=""

/usr/bin/osascript -e 'display notification "Token guardado de forma local y segura." with title "Eastern Medical Academy"'
