import { PlaygroundClient, SupportedPHPVersion } from '@wp-playground/client';
import { defaultState, PlaygroundContextType } from './context';

export type PlaygroundContextAction =
    | { type: 'SET_BROWSER_SHOWING'; payload: boolean }
    | { type: 'SET_CODE'; payload: string }
    | { type: 'SET_CONSOLE_SHOWING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_EXECUTION_TIME'; payload: number }
    | { type: 'SET_OUTPUT'; payload: string }
    | { type: 'SET_PHP_VERSION'; payload: SupportedPHPVersion | 'latest' }
    | { type: 'SET_PLAYGROUND_CLIENT'; payload: PlaygroundClient }
    | { type: 'SET_SETTINGS_OPEN'; payload: boolean }
    | { type: 'SET_WORDPRESS_VERSION'; payload: string }
    | { type: 'SET_STATE'; payload: Omit<PlaygroundContextType, 'playgroundClient'> } // Allows partial updates to the state
    | { type: 'RESET' };

export const reducer: React.Reducer<PlaygroundContextType, PlaygroundContextAction> = (state, action) => {
    switch (action.type) {
        case 'SET_BROWSER_SHOWING':
            return { ...state, browserShowing: action.payload };
        case 'SET_CODE':
            return { ...state, code: action.payload };
        case 'SET_CONSOLE_SHOWING':
            return { ...state, consoleShowing: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_EXECUTION_TIME':
            return { ...state, executionTime: action.payload };
        case 'SET_OUTPUT':
            return { ...state, output: action.payload };
        case 'SET_PHP_VERSION':
            return { ...state, phpVersion: action.payload };
        case 'SET_PLAYGROUND_CLIENT':
            return { ...state, playgroundClient: action.payload };
        case 'SET_SETTINGS_OPEN':
            return { ...state, settingsOpen: action.payload };
        case 'SET_WORDPRESS_VERSION':
            return { ...state, wordPressVersion: action.payload };
        case 'SET_STATE':
            return { ...state, ...action.payload }; // Merge the existing state with the new partial state,
        case 'RESET':
            return defaultState;
        default:
            return state;
    }
};
