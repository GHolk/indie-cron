const Emittery = require('emittery')
const fs = require('fs/promises')

class Femitter {
    constructor(...args) {
        return this._constructor(...args)
    }
    _constructor(directory) {
        this.emitter = new Emittery()
    }
    async loadDirectory(directory, regexp) {
        let fileList = await fs.readdir(directory)
        if (regexp) fileList = fileList.filter(f => f.match(regexp))
        for (const file of fileList) {
            const module = require(`${directory}/${file}`)
            await this.addModule(module)
            console.info(`load ${directory}/${file}`)
        }
    }
    async addModule(module) {
        if (module.init) await module.init()
        this.emitter.on(module.on, x => module.handler(x))
    }
    async emit(event, payload) {
        return await this.emitter.emit(event, payload)
    }
}

Object.assign(exports, {Femitter, Emittery, fs})
