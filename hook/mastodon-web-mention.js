
const wmSend = require('send-webmention')
const cheerio = require('cheerio')
const {URL} = require('url')

// exclude list

class WmCorn {
    _constructor() {
    }
    htmlToLinkRel(html) {
        const $ = cheerio.load(html)
        const link = []
        $('a').each((i, a) => {
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
        for (const link of linkList) {
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

const wmCorn = new WmCorn()
Object.assign(exports, {
    wmCorn, WmCorn,
    async run(status) {
        return await this.wmCorn.sendFromToot(status)
    },
    on: 'new-status-post'
})
