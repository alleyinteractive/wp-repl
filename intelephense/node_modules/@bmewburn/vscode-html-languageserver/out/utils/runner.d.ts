import { ResponseError, CancellationToken } from 'vscode-languageserver';
import { RuntimeEnvironment } from '../htmlServer';
export declare function formatError(message: string, err: any): string;
export declare function runSafe<T>(runtime: RuntimeEnvironment, func: () => Thenable<T>, errorVal: T, errorMessage: string, token: CancellationToken): Thenable<T | ResponseError<any>>;
