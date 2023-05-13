#!/bin/sh

prompt() {
    local name=$1
    local hint="$2"
    [ x"$hint" = x ] && hint="please input $name:"
    echo $hint
    read $name
}

set_if_empty() {
    local name value
    name=$1
    value="$2"
    if eval [ -z \"\$$name\" ]
    then
        eval $name='"$value"'
        return 0
    else
        return 1
    fi
}

app_regist() {
    prompt app_name
    set_if_empty app_name "daily backup"
    prompt app_redirect_url
    set_if_empty app_redirect_url urn:ietf:wg:oauth:2.0:oob
    prompt app_scope
    set_if_empty app_scope read
    prompt app_home_url
    prompt mastodon_url

    curl -X POST \
         -F "client_name=$app_name" \
         -F "redirect_uris=$app_redirect_url" \
         -F "scopes=read" \
         -F "website=$app_home_url" \
         $mastodon_url/api/v1/apps
}

app_authorize() {
    prompt app_id
    set_if_empty app_scope read
    prompt mastodon_url
    echo -n "$mastodon_url/oauth/authorize?client_id=$app_id&scope=$app_scope"
    echo -n "&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code"
    echo
}

app_get_token() {
    prompt app_id
    prompt app_secret
    prompt app_user_code
    prompt app_redirect_url
    set_if_empty app_redirect_url urn:ietf:wg:oauth:2.0:oob
    prompt app_scope
    set_if_empty app_scope read
    prompt mastodon_url
    curl -i -X POST \
         -F "client_id=$app_id" \
         -F "client_secret=$app_secret" \
         -F "redirect_uri=$app_redirect_url" \
         -F "grant_type=authorization_code" \
         -F "code=$app_user_code" \
         -F "scope=$app_scope" \
         $mastodon_url/oauth/token
}

app_search_uid() {
    prompt mastodon_url
    prompt username
    curl "$mastodon_url/api/v2/search?type=accounts&q=$username"
}

app_auto() {
    # we should check app exist or regist it
    if exit 1
    then app_regist
    fi
    app_authorize
    app_get_token
}
