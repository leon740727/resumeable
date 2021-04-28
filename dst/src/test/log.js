"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogSystem = void 0;
class LogSystem {
    constructor() {
        this.logs = [];
    }
    load(process) {
        return this.logs
            .filter(i => i.process === process)
            .map(i => i.data);
    }
    push(process, data) {
        this.logs.push({ process, data });
    }
    clear(process) {
        this.logs = this.logs.filter(i => i.process !== process);
    }
}
exports.LogSystem = LogSystem;
