const simple = require('request-light')
const fs = require('fs/promises')
const url = require('url')

class Fetch {
    async fetch(url, option = {}) {
        const response = await simple.xhr({url, ...option})
        return response
    }
    async download(url, path) {
        const response = await simple.xhr({url})
        await fs.writeFile(path, response.body, {flag: 'w'})
    }
    parseLink(text) {
        text = text.trim()
        const regexp = /<(.+?)>; *rel="(.*?)"(, *| *$)/y
        const link = {}
        for (let scan; scan = regexp.exec(text); true) {
            const [, url, rel] = scan
            link[rel] = url
        }
        return link
    }
    async send(url, option) {
        let data
        const headers = Object.assign({}, option.headers)
        if (option['Content-Type'] == 'application/json') {
            data = JSON.stringify(option.data)
            headers['Content-Type'] = 'application/json'
        }
        else if (option.data instanceof Object) {
            data = new url.URLSearchParams(option.data)
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
        }
        else data = option.data
        return await simple.xhr({
            url, data, headers,
            type: option.method || 'POST',
        })
    }
}

exports.Fetch = Fetch
