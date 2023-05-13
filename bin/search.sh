#!/bin/sh
pattern="$1"

if [ -f config.json ]
then cd "$(jq --raw-output .path config.json)"
fi

json=$(rgrep -l "$pattern" status favourite)
if [ -z "$json" ]
then exit 1
fi

jq --raw-output '
"\n# " + .url + "\n" +
.created_at + "\n"
+ .content + "\n"' $json
