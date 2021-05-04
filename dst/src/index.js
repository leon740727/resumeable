"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resumeable = void 0;
const events_1 = require("events");
const ramda_1 = require("ramda");
class Resumeable {
    constructor(log, steps) {
        this.log = log;
        this.steps = steps;
    }
    static build(log, fn) {
        return new Resumeable(log, [fn]);
    }
    then(fn) {
        return new Resumeable(this.log, this.steps.concat(fn));
    }
    fire(process, param) {
        try {
            this.log.push(process, param);
        }
        catch (error) {
            const e = new FireEmitter(Promise.reject(error), Promise.reject(new Error('commit error')));
            setTimeout(() => {
                e.emit(Resumeable.phase.fail, error);
            }, 0);
            return e;
        }
        // 因為 exec 有加上 async 關鍵字，他的錯誤一定是透過 promise.reject 傳出來
        // 所以不需要再用 try catch 來處理
        const res = this.exec(process, [param]);
        const e = new FireEmitter(Promise.resolve(process), res);
        setTimeout(() => {
            e.emit(Resumeable.phase.commitment, process);
            res
                .then(() => e.emit(Resumeable.phase.execution))
                .catch(error => e.emit(Resumeable.phase.fail, error));
        }, 0);
        return e;
    }
    resume(process) {
        return this.exec(process, this.log.load(process));
    }
    exec(process, logs) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputs = paddingRight(logs.slice(1), this.steps.length, undefined);
            assert.ok(logs.length > 0);
            yield ramda_1.zip(this.steps, outputs)
                .reduce((input, [step, output]) => __awaiter(this, void 0, void 0, function* () {
                if (output === undefined) {
                    if ((yield input) instanceof Done) {
                        return input;
                    }
                    else {
                        const out = yield step(yield input, { id: process, done: new Done() });
                        this.log.push(process, out || null);
                        return out;
                    }
                }
                else {
                    return Promise.resolve(output);
                }
            }), Promise.resolve(logs[0]));
            this.log.clear(process);
        });
    }
}
exports.Resumeable = Resumeable;
Resumeable.phase = {
    commitment: 'commitment',
    execution: 'execution',
    fail: 'fail',
};
class FireEmitter extends events_1.EventEmitter {
    constructor(commitment, execution) {
        super();
        this.commitment = commitment;
        this.execution = execution;
    }
}
class Done {
}
function paddingRight(list, size, defaultValue) {
    if (list.length < size) {
        return list.concat(ramda_1.range(0, size - list.length).map(_ => defaultValue));
    }
    else {
        return list;
    }
}
var assert;
(function (assert) {
    function ok(ok, message) {
        const msg = message === undefined ? 'assert ok error' : message;
        if (!ok)
            throw new Error(msg);
    }
    assert.ok = ok;
})(assert || (assert = {}));
