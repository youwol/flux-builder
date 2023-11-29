console.log = (...args) => {}

window['BroadcastChannel'] = class {
    constructor() {}
} as any
