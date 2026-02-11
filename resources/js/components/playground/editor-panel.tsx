import { cx } from 'class-variance-authority';
import { useEffect, useState } from 'react';
import { useKey } from 'react-use';

import { Editor } from '@/components/editor';
import { WelcomePanel } from '@/components/welcome-panel';
import { actionSetCode, actionSetSettingsOpen, DEFAULT_CODE } from '@/context';
import { usePlaygroundState } from '@/context/hook';
import { useIsDark } from '@/hooks/use-appearance';
import { useRunCode } from '@/hooks/use-run-code';

export function EditorPanel() {
    const [localCode, setLocalCode] = useState('');
    const isDark = useIsDark();
    const run = useRunCode();
    const {
        dispatch,
        state: { code, executionTime, multisite, phpVersion, wordPressVersion },
    } = usePlaygroundState();

    const onSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        dispatch(actionSetCode(localCode));
        run(localCode);
    };

    // Handle the Enter key to run the code when ctrl + enter is pressed.
    useKey(
        'Enter',
        (event) => {
            if (event.ctrlKey) {
                event.preventDefault();
                onSubmit();
            }
        },
        { event: 'keydown' },
        [localCode, run],
    );

    // Update local code when the global code changes.
    useEffect(() => setLocalCode(code), [code]);

    const showWelcome = code === DEFAULT_CODE;

    return (
        <form onSubmit={onSubmit} className="mr-2 flex w-1/2 max-w-1/2 flex-col border-r">
            <div className="relative flex-1">
                <Editor onChange={(value) => setLocalCode(value || '')} value={localCode} />
                {showWelcome && <WelcomePanel />}
            </div>
            {/* Bottom bar */}
            <div className="flex w-full flex-row justify-between border-t text-gray-500">
                {/* Border between children */}
                <div className="flex flex-row items-center text-xs">
                    <button
                        type="button"
                        onClick={() => dispatch(actionSetSettingsOpen())}
                        className="h-full cursor-pointer px-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        aria-label="Open settings"
                    >
                        PHP {phpVersion}
                    </button>
                    <button
                        type="button"
                        onClick={() => dispatch(actionSetSettingsOpen())}
                        className="h-full cursor-pointer px-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        aria-label="Open settings"
                    >
                        WordPress {wordPressVersion}
                        {multisite ? ' (Multisite)' : ''}
                    </button>
                    {executionTime ? <span className="ml-2">{executionTime.toFixed(2)} ms</span> : null}
                </div>
                <button
                    className={cx('ml-auto p-1 text-sm text-neutral-400 hover:cursor-pointer', {
                        'bg-neutral-800 hover:bg-neutral-600': isDark,
                        'bg-neutral-200 hover:bg-neutral-300 hover:text-neutral-500': !isDark,
                    })}
                    type="submit"
                    data-testid="run-code-button"
                >
                    Run (ctrl + enter)
                </button>
            </div>
        </form>
    );
}
