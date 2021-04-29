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
const assert = require("assert");
const index_1 = require("../src/index");
const log_1 = require("../src/test/log");
const log = new log_1.LogSystem();
const okProc = index_1.Resumeable
    .build(log, (input, process) => __awaiter(void 0, void 0, void 0, function* () {
    return 'done';
}));
const failProc = index_1.Resumeable
    .build(log, (input, process) => __awaiter(void 0, void 0, void 0, function* () {
    error('xxx');
    return 'done';
}));
describe('fire', () => {
    it('成功', () => __awaiter(void 0, void 0, void 0, function* () {
        let commitment = null;
        let execution = null;
        let fail = null;
        const res = okProc.fire('1', 1);
        res.on(index_1.Resumeable.phase.commitment, id => commitment = id);
        res.on(index_1.Resumeable.phase.execution, () => execution = true);
        res.on(index_1.Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, '1');
            assert.strictEqual(execution, true);
            assert.strictEqual(fail, null);
        }, 0);
        yield assert.doesNotReject(res.commitment);
        yield assert.doesNotReject(res.execution);
        assert.strictEqual(yield res.commitment, '1');
    }));
    it('執行失敗', () => __awaiter(void 0, void 0, void 0, function* () {
        let commitment = null;
        let execution = null;
        let fail = null;
        const res = failProc.fire('1', 1);
        res.on(index_1.Resumeable.phase.commitment, id => commitment = id);
        res.on(index_1.Resumeable.phase.execution, () => execution = true);
        res.on(index_1.Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, '1');
            assert.strictEqual(execution, null);
            assert.strictEqual(fail, 'xxx');
        }, 0);
        yield assert.doesNotReject(res.commitment);
        yield assert.rejects(res.execution, e => e === 'xxx');
        assert.strictEqual(yield res.commitment, '1');
    }));
    it('commit 失敗', () => __awaiter(void 0, void 0, void 0, function* () {
        const push = log.push;
        log.push = null; // 讓 commit 失敗
        let commitment = null;
        let execution = null;
        let fail = null;
        const res = okProc.fire('1', 1);
        log.push = push; // 還原
        res.on(index_1.Resumeable.phase.commitment, id => commitment = id);
        res.on(index_1.Resumeable.phase.execution, () => execution = true);
        res.on(index_1.Resumeable.phase.fail, error => fail = error);
        setTimeout(() => {
            assert.strictEqual(commitment, null);
            assert.strictEqual(execution, null);
            assert.ok(fail instanceof Error);
        }, 0);
        yield assert.rejects(res.commitment, error => error instanceof Error);
        yield assert.rejects(res.execution, error => error.message === 'commit error');
    }));
});
function error(error) {
    throw error;
}
