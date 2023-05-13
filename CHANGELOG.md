# change log

## release v2.3.0
* fix bug that indie-cron does not from remote url.
* add pack command to pack tarball
  and remove full path in package.json in `node_modules`

## release v2.2.0
implement hook with emittery.
current only support new-status-post event.
now, to disable hooks, just remove it from the `hook/` directory.

### webmention
* exclude hackmd and more website
* exclude mentionurl
