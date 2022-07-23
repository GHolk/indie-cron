# indie cron
Incrementally backup mastodon toot; expected to run in (ana)cron.
This script also sends webmentions to the links present in toots
from your self, not include boost.

## usage
First, you need to create a mastodon application on your server.
You need **read** permission.
Then copy the access token.
(I recommand you to buy your instance maintainer a coffee
because this application will cost little system resource.)

```sh
git clone https://github.com/GHolk/indie-cron
cd indie-cron
npm install

cp config.json.template config.json
vi config.json # config it

./index.js
```

You can put this script in (ana)crontab,
like:

```anacron
# anacron
1      2       mastodon-archive  cd /home/user/indie-cron; ./index.js
```

## config
* api-url: your instance's api url, including `v1`
* path: the directory to store toots
* limit: toots to retrieve in a single request
* access-token: your application token
* interval: interval seconds between every request
* uid: you user id. If not exist, this script will auto retrieve and save it.
  (uid can be retrieve from token.)

## behavior
This script will read `config.json` in working directory,
then `cd` to `$path` and start downloading.

Your toots are saved in `$path/status` in json format,
and favourited toots are saved in `$path/favourite`.
The attachments are saved in `$path/attachment/$toot_id`

If the `$path/status` or `$path/favourite` does not exist,
**indie-cron** will do first run,
which retrieve all toots.

Otherwise, this script will download toots until
the downloaded toots already exist.

After toots downloaded, it will try to sends webmentions
to the links in a toot.
To disable webmention, `cat /dev/null > hook/mastodon-web-mention.js` .

