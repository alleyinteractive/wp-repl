import { DEFAULT_PHP_VERSION } from '@/lib/constants';
import { PlaygroundClient, SupportedPHPVersion } from '@wp-playground/client';
import { createContext } from 'react';
import { PlaygroundContextAction } from './reducer';

export const DEFAULT_CODE = `<?php
/*
 Welcome to REPL for WordPress!

 This is a simple PHP code playground for WordPress. WordPress is
 running in your browser via WordPress Playground. Changes will
 persist until you refresh the page or navigate away.

 You can use this playground to test PHP code snippets, interact
 with WordPress functions, and see the results in real-time via
 the browser below.

 The PHP and WordPress versions can be changed by clicking the
 versions below the code editor.

 To get started, simply modify the code below and click "Run" to
 execute it. You can also share code snippets with others by
 clicking "Share" to generate a unique URL.

 Happy coding!

   -- Alley (https://alley.com/)
*/

// Load WordPress to get access to its functions.
require_once 'wordpress/wp-load.php';

// Output a simple message to the browser.
echo "Hello, World!";
`;

export type PlaygroundContextType = {
    browserShowing?: boolean;
    code: string;
    consoleShowing?: boolean;
    executionTime?: number;
    error?: string;
    output?: string;
    phpVersion: SupportedPHPVersion | 'latest';
    playgroundClient?: PlaygroundClient;
    settingsOpen?: boolean;
    wordPressVersion: string;
};

export const defaultState: PlaygroundContextType = {
    code: DEFAULT_CODE,
    consoleShowing: false,
    browserShowing: true,
    error: undefined,
    executionTime: undefined,
    output: undefined,
    phpVersion: DEFAULT_PHP_VERSION,
    playgroundClient: undefined,
    settingsOpen: false,
    wordPressVersion: 'latest',
};

export const PlaygroundStateContext = createContext<PlaygroundContextType>(defaultState);
export const PlaygroundDispatchContext = createContext<React.Dispatch<PlaygroundContextAction>>(() => {});
