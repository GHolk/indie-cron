#!/usr/bin/env node

const https = require('https')
const process = require('process')
const fs = require('fs')
const child_process = require('child_process')
const util = require('util')

const {Femitter} = require('./lib/femitter.js')
const {Fetch} = require('./lib/fetch.js')

class MastodonArchiver extends Femitter {
    _constructor() {
        super._constructor()
        this.fetch = new Fetch()
    }
    async fetchApi(path, option) {
        return await this.fetch.fetch(`${this.config['api-url']}/${path}`, {
            headers: {
                Authorization: `Bearer ${this.config['access-token']}`
            },
            ...option
        })
    }
    static async main() {
        const configPath = process.cwd() + '/config.json'
        const config = require(configPath)
        const object = new this()
        await object.loadDirectory(__dirname + '/hook', /\.js$/i)
        object.setOption(config)
        if (!config.uid) {
            const response = await object.fetchApi(
                'accounts/verify_credentials'
            )
            const json = JSON.parse(response.responseText)
            object.config.uid = config.uid = json.id
            console.log(`set uid ${config.uid} in ${configPath}`)
            fs.writeFileSync(
                configPath,
                JSON.stringify(config, null, 2),
                'utf8'
            )
        }
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
            this.directoryExistOrCreate('attachment')
        }
        await this.backup(`accounts/${this.config.uid}/statuses`, 'status')

        if (!this.directoryExistOrCreate('favourite')) {
            this.init = true
            console.log('initiating favourite')
            this.directoryExistOrCreate('attachment')
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
                for (const status of list) {
                    await this.statusSave(status, subDir)
                }
                list = []
            }
            else if (this.statusExist(firstStatusCurrent.id, subDir)) break

            const link = this.fetch.parseLink(response.headers.link)
            url = link['next']
            await this.fetch.sleep(this.config.interval)
        }
        while (url)

        for (const status of list.slice().reverse()) {
            if (!this.statusExist(status.id, subDir)) {
                if (subDir == 'status') {
                    await this.emit('new-status-post', status)
                }
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
        for (let s = status; s.reblog; s = s.reblog) {
            const attachment = s['media_attachments']
            if (attachment && attachment.length > 0) {
                await this.attachmentSave(s)
            }
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
            console.log(`download ${url} attachment/${post}/${file}`)
            await this.fetch.download(url, `attachment/${post}/${file}`)
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

if (require.main == module) MastodonArchiver.main()
else exports.MastodonArchiver = MastodonArchiver
