#!/usr/bin/env node

const https = require('https')
const process = require('process')
const fs = require('fs')
const child_process = require('child_process')
const util = require('util')

const {Fetch} = require('./lib/fetch.js')

class MastodonArchiver {
    constructor(...args) {
        this._constructor(...args)
    }
    _constructor() {
        this.fetch = new Fetch()
    }
    static main() {
        const config = require('./config.json')
        const object = new this()
        object.setOption(config)
        object.run()
    }
    setOption(option) {
        this.config = Object.assign({}, option)
        process.chdir(this.config.path)
    }
    async run() {
        this.init = false
        if (!this.directoryExistOrCreate('status')) {
            this.init = true
            console.log('initiating')
        }
        await this.backup(`accounts/${this.config.uid}/statuses`, 'status')

        if (!this.directoryExistOrCreate('favourite')) {
            this.init = true
            console.log('initiating favourite')
        }
        else this.init = false
        await this.backup('favourites', 'favourite')
    }
    async backup(apiPath, subDir) {
        console.log(`save into ${subDir}`)
        const base = this.config['api-url']
        let limit = this.config.limit
        let json = ''
        let list = []
        let firstStatus
        let url = `${base}/${apiPath}?limit=${limit}`
        do {
            console.log(`fetch ${url}`)
            const response = await this.fetch.fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.config['access-token']}`
                }
            })
            list = list.concat(JSON.parse(response.responseText))
            const firstStatusCurrent = list[list.length-1]
            if (this.init) {
                if (firstStatus == firstStatusCurrent.id) break
                else firstStatus = firstStatusCurrent.id
            }
            else if (this.statusExist(firstStatusCurrent.id, subDir)) break

            const link = this.fetch.parseLink(response.headers.link)
            url = link['next']
        }
        while (true)

        for (const status of list.slice().reverse()) {
            if (!this.statusExist(status.id, subDir)) {
                await this.statusSave(status, subDir)
            }
        }
    }
    directoryExistOrCreate(name) {
        let exist = true
        try {
            fs.accessSync(name)
        }
        catch (accessError) {
            exist = false
        }
        if (exist) return true
        else {
            fs.mkdirSync(name)
            return false
        }
    }
    async statusSave(status, dir) {
        fs.writeFileSync(
            `${dir}/${status.id}.json`, JSON.stringify(status), 'utf8'
        )
        const attachment = status['media_attachments']
        if (attachment && attachment.length > 0) {
            await this.attachmentSave(status)
        }
    }
    async attachmentSave(status) {
        const attachments = status.media_attachments
        const post = status.id
        try {
            fs.mkdirSync(`attachment/${post}`)
        }
        catch (error) {
            console.log(error)
        }
        for (const item of attachments) {
            const url = item.remote_url || item.url
            const scan = item.url.match(/\.\w+$/)
            let suffix = ''
            if (scan) suffix = scan[0]
            const file = item.id + suffix
            console.log(`download ${item.url} attachment/${post}/${file}`)
            await this.fetch.download(item.url, `attachment/${post}/${file}`)
        }
    }
    statusExist(id, dir) {
        try {
            fs.accessSync(`${dir}/${id}.json`)
        }
        catch (accessError) {
            return false
        }
        return true
    }
}

// class WebMentionSender {
//     async post(url, dict) {
//         const query = this.querystring.encode(dict)
//         await this.fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//             body: query
//         })
//     }
//     async send(origin, reply) {
//         const endPoint = await this.findEndPoint(origin)
//         if (!endPoint) return
//         await this.fetch(endPoint, {
//             source: reply,
//             target: origin
//         })
//     }
// }

if (require.main == module) MastodonArchiver.main()
else exports.MastodonArchiver = MastodonArchiver
