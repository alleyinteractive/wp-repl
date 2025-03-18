import { PlaygroundContextType } from '@/context/context';
import { PlaygroundClient, SupportedPHPVersion } from '@wp-playground/client';

export const actionSetBrowserShowing = (showing: boolean = true) => ({
    type: 'SET_BROWSER_SHOWING' as const,
    payload: showing,
});

export const actionSetCode = (code: string) => ({
    type: 'SET_CODE' as const,
    payload: code,
});

export const actionSetConsoleShowing = (showing: boolean = true) => ({
    type: 'SET_CONSOLE_SHOWING' as const,
    payload: showing,
});

export const actionSetError = (error: string) => ({
    type: 'SET_ERROR' as const,
    payload: error,
});

export const actionSetExecutionTime = (executionTime: number) => ({
    type: 'SET_EXECUTION_TIME' as const,
    payload: executionTime,
});

export const actionSetOutput = (output: string) => ({
    type: 'SET_OUTPUT' as const,
    payload: output,
});

export const actionSetPhpVersion = (phpVersion: SupportedPHPVersion) => ({
    type: 'SET_PHP_VERSION' as const,
    payload: phpVersion,
});

export const actionSetPlaygroundClient = (playgroundClient: PlaygroundClient) => ({
    type: 'SET_PLAYGROUND_CLIENT' as const,
    payload: playgroundClient,
});

export const actionSetSettingsOpen = (status: boolean = true) => ({
    type: 'SET_SETTINGS_OPEN' as const,
    payload: status,
});

export const actionSetWordPressVersion = (wordPressVersion: string) => ({
    type: 'SET_WORDPRESS_VERSION' as const,
    payload: wordPressVersion,
});

export const actionSetState = (state: Omit<PlaygroundContextType, 'playgroundClient'>) => ({
    type: 'SET_STATE' as const,
    payload: state,
});

export const actionReset = () => ({
    type: 'RESET' as const,
});
