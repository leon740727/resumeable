import { EventEmitter } from 'events';
import { range, zip } from 'ramda';

interface RedoLogSystem {
    load (process: string): any[];
    push (process: string, log: any);
    clear (process: string);
}

interface Process {
    id: string;
    done: Done;                 // 在執行流程中間就宣告任務完成
}

export class Resumeable <Init, Output> {
    constructor (
        private log: RedoLogSystem,
        private steps: ((input: any, process: Process) => Promise<any>)[],
    ) {}

    static build <Init, Output> (
        log: RedoLogSystem,
        fn: (input: Init, process: Process) => Promise<Output>,
    ) {
        return new Resumeable<Init, Output>(log, [fn]);
    }

    then <Result> (
        fn: (input: Output, process: Process) => Promise<Result>,
    ): Resumeable<Init, Result> {
        return new Resumeable(this.log, this.steps.concat(fn));
    }

    static phase = {
        commitment: 'commitment',
        execution: 'execution',
        fail: 'fail',
    };

    fire (process: string, param: Init): FireEmitter {
        try {
            if (this.log.load(process).length > 0) {
                throw new DuplicatedProcessError();
            }
            this.log.push(process, param);
        } catch (error) {
            const e = new FireEmitter(Promise.reject(error), Promise.reject(new Error('commit error')));
            setTimeout(() => {
                e.emit(Resumeable.phase.fail, error);
            }, 0);
            return e;
        }
        // 因為 exec 有加上 async 關鍵字，他的錯誤一定是透過 promise.reject 傳出來
        // 所以不需要再用 try catch 來處理
        const res = this.exec(process, [ param ]);
        const e = new FireEmitter(Promise.resolve(process), res);
        setTimeout(() => {
            e.emit(Resumeable.phase.commitment, process);
            res
            .then(() => e.emit(Resumeable.phase.execution))
            .catch(error => e.emit(Resumeable.phase.fail, error));
        }, 0);
        return e;
    }

    resume (process: string) {
        return this.exec(process, this.log.load(process));
    }

    private async exec (process: string, logs: any[]) {
        const outputs = paddingRight(logs.slice(1), this.steps.length, undefined);
        assert.ok(logs.length > 0);

        await zip(this.steps, outputs)
        .reduce(async (input, [ step, output ]) => {
            if (output === undefined) {
                if (await input instanceof Done) {
                    return input;
                } else {
                    const out = await step(await input, { id: process, done: new Done()});
                    this.log.push(process, out || null);
                    return out;
                }
            } else {
                return Promise.resolve(output);
            }
        }, Promise.resolve(logs[0]));

        this.log.clear(process);
    }
}

class FireEmitter extends EventEmitter {
    constructor (
        readonly commitment: Promise<string>,
        readonly execution: Promise<void>,
    ) {
        super();
    }
}

class Done {}

class DuplicatedProcessError extends Error {
    constructor () {
        super();
        this.message = 'duplicated process';
    }
}

function paddingRight <T> (list: T[], size: number, defaultValue: T) {
    if (list.length < size) {
        return list.concat(range(0, size - list.length).map(_ => defaultValue));
    } else {
        return list;
    }
}

namespace assert {
    export function ok (ok: boolean, message?: string) {
        const msg: string = message === undefined ? 'assert ok error' : message;
        if (!ok) throw new Error(msg);
    }
}
