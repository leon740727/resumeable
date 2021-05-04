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
const proc = index_1.Resumeable
    .build(new log_1.LogSystem(), (input) => __awaiter(void 0, void 0, void 0, function* () {
    return 'done';
}));
describe('fire', () => {
    it('error on duplicated process', () => __awaiter(void 0, void 0, void 0, function* () {
        const [fire1, fire2] = [proc.fire('1', 1), proc.fire('1', 2)];
        yield assert.rejects(Promise.all([
            fire1.commitment,
            fire2.commitment,
        ]), error => error.message === 'duplicated process');
        yield assert.rejects(Promise.all([
            fire1.execution,
            fire2.execution,
        ]), error => error.message === 'commit error');
    }));
});
