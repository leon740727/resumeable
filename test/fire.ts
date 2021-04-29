import * as assert from 'assert';
import { Resumeable } from '../src/index';
import { LogSystem } from '../src/test/log';

declare const describe, it, afterEach;

const log = new LogSystem();

const okProc = Resumeable
.build(log, async (input: number, process) => {
    return 'done';
});

const failProc = Resumeable
.build(log, async (input: number, process) => {
    error('xxx');
    return 'done';
});

describe('fire', () => {
    it('成功', async () => {
        let commitment = null;
        let execution: boolean | null = null;
        let fail = null;
        
        const res = okProc.fire('1', 1);

        res.on(Resumeable.phase.commitment, id => commitment = id);
        res.on(Resumeable.phase.execution, () => execution = true);
        res.on(Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, '1');
            assert.strictEqual(execution, true);
            assert.strictEqual(fail, null);
        }, 0);

        await assert.doesNotReject(res.commitment);
        await assert.doesNotReject(res.execution);
        assert.strictEqual(await res.commitment, '1');
    });

    it('執行失敗', async () => {
        let commitment = null;
        let execution: boolean | null = null;
        let fail = null;
        
        const res = failProc.fire('1', 1);

        res.on(Resumeable.phase.commitment, id => commitment = id);
        res.on(Resumeable.phase.execution, () => execution = true);
        res.on(Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, '1');
            assert.strictEqual(execution, null);
            assert.strictEqual(fail, 'xxx');
        }, 0);

        await assert.doesNotReject(res.commitment);
        await assert.rejects(res.execution, e => e === 'xxx');
        assert.strictEqual(await res.commitment, '1');
    });

    it('commit 失敗', async () => {
        const push = log.push;
        log.push = null as any;             // 讓 commit 失敗

        let commitment = null;
        let execution: boolean | null = null;
        let fail: any = null;
        
        const res = okProc.fire('1', 1);
        log.push = push;                    // 還原

        res.on(Resumeable.phase.commitment, id => commitment = id);
        res.on(Resumeable.phase.execution, () => execution = true);
        res.on(Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, null);
            assert.strictEqual(execution, null);
            assert.ok(fail instanceof Error);
        }, 0);

        await assert.rejects(res.commitment, error => error instanceof Error);
        await assert.rejects(res.execution, error => (error as Error).message === 'commit error');
    });
});

function error (error: string) {
    throw error;
}
