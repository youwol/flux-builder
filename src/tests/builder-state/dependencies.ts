console.log = (...args) => {}
class FakeBroadcastChannel{ constructor(a){}}
window["BroadcastChannel"] = FakeBroadcastChannel as any