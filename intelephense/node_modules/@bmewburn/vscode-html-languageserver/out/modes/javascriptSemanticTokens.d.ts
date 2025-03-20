import { TextDocument, SemanticTokenData } from './languageModes';
import * as ts from 'typescript';
export declare function getSemanticTokenLegend(): {
    types: string[];
    modifiers: string[];
};
export declare function getSemanticTokens(jsLanguageService: ts.LanguageService, document: TextDocument, fileName: string): Iterable<SemanticTokenData>;
