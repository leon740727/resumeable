type Log = {
    process: string,
    data: any,
}

export class LogSystem {
    public logs: Log[] = [];

    load (process: string) {
        return this.logs
        .filter(i => i.process === process)
        .map(i => i.data);
    }

    push (process: string, data: any) {
        this.logs.push({ process, data });
    }

    clear (process: string) {
        this.logs = this.logs.filter(i => i.process !== process);
    }
}
