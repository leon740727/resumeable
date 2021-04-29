/// <reference types="node" />
import * as Emitter from 'events';
interface RedoLogSystem {
    load(process: string): any[];
    push(process: string, log: any): any;
    clear(process: string): any;
}
interface Process {
    id: string;
    done: Done;
}
export declare class Resumeable<Init, Output> {
    private log;
    private steps;
    constructor(log: RedoLogSystem, steps: ((input: any, process: Process) => Promise<any>)[]);
    static build<Init, Output>(log: RedoLogSystem, fn: (input: Init, process: Process) => Promise<Output>): Resumeable<Init, Output>;
    then<Result>(fn: (input: Output, process: Process) => Promise<Result>): Resumeable<Init, Result>;
    static phase: {
        commitment: string;
        execution: string;
        fail: string;
    };
    fire(process: string, param: Init): FireEmitter;
    resume(process: string): Promise<void>;
    private exec;
}
declare class FireEmitter extends Emitter {
    readonly commitment: Promise<string>;
    readonly execution: Promise<void>;
    constructor(commitment: Promise<string>, execution: Promise<void>);
}
declare class Done {
}
export {};
