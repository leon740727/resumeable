import * as assert from 'assert';
import { Resumeable } from '../src/index';
import { LogSystem } from '../src/test/log';

declare const describe, it, afterEach;

const proc = Resumeable
.build(new LogSystem(), async (input: number) => {
    return 'done';
});

describe('fire', () => {
    it('error on duplicated process', async () => {
        const [ fire1, fire2 ] = [ proc.fire('1', 1), proc.fire('1', 2) ];
        await assert.rejects(Promise.all([
            fire1.commitment,
            fire2.commitment,
        ]), error => error.message === 'duplicated process');

        await assert.rejects(Promise.all([
            fire1.execution,
            fire2.execution,
        ]), error => error.message === 'commit error');
    });
});
