import {
    PlaygroundContextAction,
    RESET,
    SET_BROWSER_SHOWING,
    SET_CODE,
    SET_CONSOLE_SHOWING,
    SET_ERROR,
    SET_EXECUTION_TIME,
    SET_MULTISITE,
    SET_OUTPUT,
    SET_PHP_VERSION,
    SET_PLAYGROUND_CLIENT,
    SET_SETTINGS_OPEN,
    SET_STATE,
    SET_WORDPRESS_VERSION,
} from './actions';
import { defaultState, PlaygroundContextType } from './context';

export const reducer: React.Reducer<PlaygroundContextType, PlaygroundContextAction> = (state, action) => {
    switch (action.type) {
        case SET_BROWSER_SHOWING:
            return { ...state, browserShowing: action.payload };
        case SET_CODE:
            return { ...state, code: action.payload };
        case SET_CONSOLE_SHOWING:
            return { ...state, consoleShowing: action.payload };
        case SET_ERROR:
            return { ...state, error: action.payload };
        case SET_EXECUTION_TIME:
            return { ...state, executionTime: action.payload };
        case SET_MULTISITE:
            return { ...state, multisite: action.payload };
        case SET_OUTPUT:
            return { ...state, output: action.payload };
        case SET_PHP_VERSION:
            return { ...state, phpVersion: action.payload };
        case SET_PLAYGROUND_CLIENT:
            return { ...state, playgroundClient: action.payload };
        case SET_SETTINGS_OPEN:
            return { ...state, settingsOpen: action.payload };
        case SET_WORDPRESS_VERSION:
            return { ...state, wordPressVersion: action.payload };
        case SET_STATE:
            return { ...state, ...action.payload };
        case RESET:
            return defaultState;
        default:
            return state;
    }
};
