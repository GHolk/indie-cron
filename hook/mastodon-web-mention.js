
const wmSend = require('send-webmention')
const cheerio = require('cheerio')
const {URL} = require('url')
const fs = require('fs/promises')

// exclude list

class WmCron {
    constructor(...args) {
        this._constructor(...args)
    }
    _constructor() {
        this.excludeUrlList = []
    }
    async excludeUrlLoad(path) {
        const file = await fs.readFile(path, 'utf8')
        file.trim().split(/\n/).forEach(line => {
            if (line.charAt(0) == '#') return
            if (!line.trim()) return
            let result = line
            let scan
            if (scan = line.match(/^\/(.*)\/([a-z]*)$/)) {
                result = new RegExp(scan[1], scan[2])
            }
            this.excludeUrlList.push(result)
        })
    }
    excludeUrlFilter(list) {
        return list.filter(u => {
            const match = this.excludeUrlList.some(m => u.match(m))
            if (match) console.debug(`exclude ${u}`)
            return !match
        })
    }
    htmlToLinkRel(html) {
        const $ = cheerio.load(html)
        const link = []
        $('a:not(.mention):not(.hashtag)').each((i, a) => {
            const url = $(a).attr('href')
            link.push(url)
        })
        return link
        // deal with <base>
    }
    htmlToLinkAbs(html, url) {
        const link = this.htmlToLinkRel(html)
        return link.map(rel => this.linkRelToAbs(rel, url))
    }
    linkRelToAbs(rel, url) {
        const uo = new URL(rel, url)
        return uo.href
    }
    async sendFromToot(status) {
        const url = status.url
        const html = status.content // content is empty string if reblog
        const linkList = this.htmlToLinkAbs(html, url)
        for (const link of this.excludeUrlFilter(linkList)) {
            let result
            console.info(`send ${url} to ${link}`)
            try {
                result = await this.wmSend(url, link)
            }
            catch (error) {
                console.error(`get error`)
                console.dir(error)
                continue
            }
            const res = result.res
            if (!res) console.dir(result)
            else {
                if (result.sucess) {
                    console.info(res.statusCode, res.statusMessage)
                }
                else console.error(res.statusCode, res.statusMessage)
            }
        }
    }
    async wmSend(reply, origin) {
        return await new Promise((ok, reject) => {
            wmSend(reply, origin, (error, result) => {
                if (error) reject(error)
                else ok(result)
            })
        })
    }
}

const wmCron = new WmCron()
Object.assign(exports, {
    wmCron, WmCron,
    async init() {
        try {
            await this.wmCron.excludeUrlLoad('webmention-exclude.url')
        }
        catch (error) {
            console.error(error)
        }
    },
    async handler(status) {
        return await this.wmCron.sendFromToot(status)
    },
    on: 'new-status-post'
})
