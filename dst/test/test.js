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
let errorWhen = null;
let doneWhen = null;
let execState = []; // 紀錄執行狀況
function reset() {
    log.logs = [];
    errorWhen = null;
    doneWhen = null;
    execState = [];
}
const proc = index_1.Resumeable
    .build(log, (input, process) => __awaiter(void 0, void 0, void 0, function* () {
    if (input === errorWhen)
        throw `錯誤: (${input})`;
    if (input === doneWhen)
        return process.done;
    execState.push(input);
    return input + 1;
}))
    .then((input, process) => __awaiter(void 0, void 0, void 0, function* () {
    if (input === errorWhen)
        throw `錯誤: (${input})`;
    if (input === doneWhen)
        return process.done;
    execState.push(input);
    return input + 1;
}))
    .then((input, process) => __awaiter(void 0, void 0, void 0, function* () {
    if (input === errorWhen)
        throw `錯誤: (${input})`;
    if (input === doneWhen)
        return process.done;
    execState.push(input);
    return input + 1;
}));
describe('正常流程', () => {
    afterEach(reset);
    it('走完全程', () => __awaiter(void 0, void 0, void 0, function* () {
        yield proc.fire('1', 1);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1, 2, 3]));
    }));
    it('第 1 步完成', () => __awaiter(void 0, void 0, void 0, function* () {
        doneWhen = 1;
        yield proc.fire('1', 1);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
    }));
    it('第 2 步完成', () => __awaiter(void 0, void 0, void 0, function* () {
        doneWhen = 2;
        yield proc.fire('1', 1);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));
    }));
});
describe('失敗流程', () => {
    afterEach(reset);
    it('第 1 步失敗', () => __awaiter(void 0, void 0, void 0, function* () {
        errorWhen = 1;
        yield assert.rejects(() => proc.fire('1', 1), error => error === `錯誤: (1)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
    }));
    it('第 2 步失敗', () => __awaiter(void 0, void 0, void 0, function* () {
        errorWhen = 2;
        yield assert.rejects(() => proc.fire('1', 1), error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));
    }));
    it('resume', () => __awaiter(void 0, void 0, void 0, function* () {
        errorWhen = 2;
        yield assert.rejects(() => proc.fire('1', 1), error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([1]));
        // try again
        execState = [];
        yield assert.rejects(() => proc.resume('1'), error => error === `錯誤: (2)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
        // try again...這次推進了一步
        errorWhen = 3;
        yield assert.rejects(() => proc.resume('1'), error => error === `錯誤: (3)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([2]));
        // try again
        execState = [];
        yield assert.rejects(() => proc.resume('1'), error => error === `錯誤: (3)`);
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([]));
        // done
        errorWhen = null;
        execState = [];
        yield proc.resume('1');
        assert.strictEqual(JSON.stringify(execState), JSON.stringify([3]));
    }));
});
