declare type Log = {
    process: string;
    data: any;
};
export declare class LogSystem {
    logs: Log[];
    load(process: string): any[];
    push(process: string, data: any): void;
    clear(process: string): void;
}
export {};
