import { Connection, Disposable } from 'vscode-languageserver';
import { FileSystemProvider } from './requests';
export interface RuntimeEnvironment {
    fileFs?: FileSystemProvider;
    configureHttpRequests?(proxy: string | undefined, strictSSL: boolean): void;
    readonly timer: {
        setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable;
        setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable;
    };
}
export interface CustomDataRequestService {
    getContent(uri: string): Promise<string>;
}
export declare function startServer(connection: Connection, runtime: RuntimeEnvironment): void;
