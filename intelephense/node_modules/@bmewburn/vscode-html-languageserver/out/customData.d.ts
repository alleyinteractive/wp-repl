import { IHTMLDataProvider } from 'vscode-html-languageservice';
import { CustomDataRequestService } from './htmlServer';
export declare function fetchHTMLDataProviders(dataPaths: string[], requestService: CustomDataRequestService): Promise<IHTMLDataProvider[]>;
