import * as assert from 'assert';
import { Resumeable } from '../src/index';
import { LogSystem } from '../src/test/log';

declare const describe, it, afterEach;

// 防止 unit test 沒有寫對而漏掉 rejection 錯誤
process.on('unhandledRejection', e => {
    console.log('unhandledRejection occurred !!', e);
});

const log = new LogSystem();

let errorWhen: number | null = null;
let doneWhen: number | null = null;
let execState: number[] = [];           // 紀錄執行狀況

function reset () {
    log.logs = [];
    errorWhen = null;
    doneWhen = null;
    execState = [];
}

const proc = Resumeable
.build(log, async (input: number, process) => {
    if (input === errorWhen) throw `錯誤: (${input})`;
    if (input === doneWhen) return process.done as any as number;
    execState.push(input);
    return input + 1;
})
.then(async (input, process) => {
    if (input === errorWhen) throw `錯誤: (${input})`;
    if (input === doneWhen) return process.done as any as number;
    execState.push(input);
    return input + 1;
})
.then(async (input, process) => {
    if (input === errorWhen) throw `錯誤: (${input})`;
    if (input === doneWhen) return process.done as any as number;
    execState.push(input);
    return input + 1;
});

describe('正常流程', () => {
    afterEach(reset);

    it('走完全程', async () => {
        await proc.fire('1', 1).execution;
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1,2,3]));
    });

    it('第 1 步完成', async () => {
        doneWhen = 1;
        await proc.fire('1', 1).execution;
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
    });

    it('第 2 步完成', async () => {
        doneWhen = 2;
        await proc.fire('1', 1).execution;
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));
    });
});

describe('失敗流程', () => {
    afterEach(reset);

    it('第 1 步失敗', async () => {
        errorWhen = 1;
        await assert.rejects(() => proc.fire('1', 1).execution, error => error === `錯誤: (1)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
    });

    it('第 2 步失敗', async () => {
        errorWhen = 2;
        await assert.rejects(() => proc.fire('1', 1).execution, error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));
    });

    it('resume', async () => {
        errorWhen = 2;
        await assert.rejects(() => proc.fire('1', 1).execution, error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));

        // try again
        execState = [];
        await assert.rejects(() => proc.resume('1'), error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));

        // try again...這次推進了一步
        errorWhen = 3;
        await assert.rejects(() => proc.resume('1'), error => error === `錯誤: (3)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([2]));

        // try again
        execState = [];
        await assert.rejects(() => proc.resume('1'), error => error === `錯誤: (3)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));

        // done
        errorWhen = null;
        execState = [];
        await proc.resume('1');
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([3]));
    });
});
