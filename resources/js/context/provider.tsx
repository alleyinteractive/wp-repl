import React, { useEffect, useReducer } from 'react';

import { usePage } from '@/hooks/use-page';
import { actionSetState } from './actions';
import { defaultState, PlaygroundDispatchContext, PlaygroundStateContext } from './context';
import { reducer } from './reducer';

const localStorageKey = 'state';

export function PlaygroundProvider({ children }: React.PropsWithChildren) {
    const [state, dispatch] = useReducer(reducer, defaultState);
    const { error = '' } = state;
    const {
        props: { share = undefined },
    } = usePage();

    // Replace the state with local storage and page props upon load.
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let ls: any = localStorage?.getItem(localStorageKey);

        if (ls) {
            try {
                ls = JSON.parse(ls) || {};

                if (typeof ls !== 'object') {
                    ls = {};
                }
            } catch (err: unknown) {
                console.error('Error parsing local storage.', err);
                ls = {};
            }
        }

        const state = {
            ...defaultState,
            // Use the local storage settings if they exist.
            ...getLocalStorage(),
            // Override with the share settings if they exist.
            ...(share ? { code: share.code, wordPressVersion: share.wordpress_version, phpVersion: share.php_version } : {}),
        };

        dispatch(actionSetState(state));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Store the state in local storage whenever it changes.
    useEffect(() => {
        localStorage?.setItem(
            localStorageKey,
            JSON.stringify({
                ...state,
                // Avoid including specific properties but store other properties
                // such as WordPress version, show/hide console, etc.
                code: undefined,
                output: undefined,
                playgroundClient: undefined,
            }),
        );
    }, [state]);

    useEffect(() => {
        if (error) {
            console.error(`Playground Error: ${error}`);
        }
    }, [error]);

    return (
        <PlaygroundStateContext.Provider value={state}>
            <PlaygroundDispatchContext.Provider value={dispatch}>{children}</PlaygroundDispatchContext.Provider>
        </PlaygroundStateContext.Provider>
    );
}

// Helper function to get the local storage state.
const getLocalStorage = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ls: any = localStorage?.getItem(localStorageKey);

    if (ls) {
        try {
            ls = JSON.parse(ls) || {};
            if (typeof ls !== 'object') {
                ls = {};
            }
        } catch (err: unknown) {
            console.error('Error parsing local storage.', err);
            ls = {};
        }
    }

    return ls;
};
