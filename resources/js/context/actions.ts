import { PlaygroundContextType } from '@/context/context';
import { PlaygroundClient, SupportedPHPVersion } from '@wp-playground/client';

export const SET_BROWSER_SHOWING = 'SET_BROWSER_SHOWING' as const;
export const SET_CODE = 'SET_CODE' as const;
export const SET_CONSOLE_SHOWING = 'SET_CONSOLE_SHOWING' as const;
export const SET_ERROR = 'SET_ERROR' as const;
export const SET_EXECUTION_TIME = 'SET_EXECUTION_TIME' as const;
export const SET_LOADING = 'SET_LOADING' as const;
export const SET_MULTISITE = 'SET_MULTISITE' as const;
export const SET_OUTPUT = 'SET_OUTPUT' as const;
export const SET_PHP_VERSION = 'SET_PHP_VERSION' as const;
export const SET_PLAYGROUND_CLIENT = 'SET_PLAYGROUND_CLIENT' as const;
export const SET_PLAYGROUND_READY = 'SET_PLAYGROUND_READY' as const;
export const SET_PLUGINS = 'SET_PLUGINS' as const;
export const SET_SETTINGS_OPEN = 'SET_SETTINGS_OPEN' as const;
export const SET_THEMES = 'SET_THEMES' as const;
export const SET_WORDPRESS_VERSION = 'SET_WORDPRESS_VERSION' as const;
export const SET_STATE = 'SET_STATE' as const;
export const RESET = 'RESET' as const;

export const actionSetBrowserShowing = (showing: PlaygroundContextType['browserShowing'] = true) => ({
    type: SET_BROWSER_SHOWING,
    payload: showing,
});

export const actionSetCode = (code: PlaygroundContextType['code']) => ({
    type: SET_CODE,
    payload: code,
});

export const actionSetConsoleShowing = (showing: PlaygroundContextType['consoleShowing'] = true) => ({
    type: SET_CONSOLE_SHOWING,
    payload: showing,
});

export const actionSetError = (error: PlaygroundContextType['error']) => ({
    type: SET_ERROR,
    payload: error,
});

export const actionSetExecutionTime = (executionTime: PlaygroundContextType['executionTime']) => ({
    type: SET_EXECUTION_TIME,
    payload: executionTime,
});

export const actionSetLoading = (loading: PlaygroundContextType['loading'] = true) => ({
    type: SET_LOADING,
    payload: loading,
});

export const actionSetMultisite = (multisite: PlaygroundContextType['multisite'] = false) => ({
    type: SET_MULTISITE,
    payload: multisite,
});

export const actionSetOutput = (output: PlaygroundContextType['output']) => ({
    type: SET_OUTPUT,
    payload: output,
});

export const actionSetPhpVersion = (phpVersion: SupportedPHPVersion) => ({
    type: SET_PHP_VERSION,
    payload: phpVersion,
});

export const actionSetPlaygroundClient = (playgroundClient: PlaygroundClient) => ({
    type: SET_PLAYGROUND_CLIENT,
    payload: playgroundClient,
});

export const actionSetPlaygroundReady = (ready: PlaygroundContextType['playgroundReady'] = true) => ({
    type: SET_PLAYGROUND_READY,
    payload: ready,
});

export const actionSetPlugins = (plugins: PlaygroundContextType['plugins']) => ({
    type: SET_PLUGINS,
    payload: plugins,
});

export const actionSetSettingsOpen = (status: PlaygroundContextType['settingsOpen'] = true) => ({
    type: SET_SETTINGS_OPEN,
    payload: status,
});

export const actionSetThemes = (themes: PlaygroundContextType['themes']) => ({
    type: SET_THEMES,
    payload: themes,
});

export const actionSetWordPressVersion = (wordPressVersion: PlaygroundContextType['wordPressVersion']) => ({
    type: SET_WORDPRESS_VERSION,
    payload: wordPressVersion,
});

export const actionSetState = (state: Partial<PlaygroundContextType>) => ({
    type: SET_STATE,
    payload: state,
});

export const actionReset = () => ({
    type: RESET,
});

export type PlaygroundContextAction =
    | ReturnType<typeof actionSetBrowserShowing>
    | ReturnType<typeof actionSetCode>
    | ReturnType<typeof actionSetConsoleShowing>
    | ReturnType<typeof actionSetError>
    | ReturnType<typeof actionSetExecutionTime>
    | ReturnType<typeof actionSetLoading>
    | ReturnType<typeof actionSetMultisite>
    | ReturnType<typeof actionSetOutput>
    | ReturnType<typeof actionSetPhpVersion>
    | ReturnType<typeof actionSetPlaygroundClient>
    | ReturnType<typeof actionSetPlaygroundReady>
    | ReturnType<typeof actionSetPlugins>
    | ReturnType<typeof actionSetSettingsOpen>
    | ReturnType<typeof actionSetThemes>
    | ReturnType<typeof actionSetWordPressVersion>
    | ReturnType<typeof actionSetState>
    | ReturnType<typeof actionReset>;
