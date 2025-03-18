import { router } from '@inertiajs/react';
import { startPlaygroundWeb } from '@wp-playground/client';
import { cx } from 'class-variance-authority';
import { useEffect, useRef, useTransition } from 'react';

import { AlleyLogo } from '@/components/alley';
import { ConsolePanel, EditorPanel, OutputPanel, SettingsPanel } from '@/components/playground/index';
import { SharePopover } from '@/components/share';
import { Button } from '@/components/ui/button';
import { actionSetBrowserShowing, actionSetConsoleShowing, actionSetPlaygroundClient, DEFAULT_CODE } from '@/context';
import { usePlaygroundState } from '@/context/hook';
import { usePage } from '@/hooks/use-page';
import { useRunCode } from '@/hooks/use-run-code';
import { cn } from '@/lib/utils';

/**
 * Sandbox Playground Application
 */
export default function Playground() {
    const run = useRunCode();
    const page = usePage();
    const [sharing, startTransition] = useTransition();
    const { state, dispatch } = usePlaygroundState();
    const { code, browserShowing, consoleShowing, phpVersion, playgroundClient, wordPressVersion } = state;
    const iframe = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const setupPlayground = async () => {
            const client = await startPlaygroundWeb({
                iframe: iframe.current!,
                remoteUrl: 'https://playground.wordpress.net/remote.html',
                blueprint: {
                    preferredVersions: {
                        php: phpVersion,
                        wp: wordPressVersion,
                    },
                    features: {
                        networking: true,
                    },
                    landingPage: '/',
                    steps: [{ step: 'login', username: 'admin', password: 'password' }],
                },
                sapiName: 'cli',
            });

            await client.isReady();

            dispatch(actionSetPlaygroundClient(client));
        };

        if (iframe.current) {
            setupPlayground();
        }
    }, [dispatch, iframe, phpVersion, wordPressVersion]);

    // Run the playground client when it is ready.
    useEffect(() => {
        if (playgroundClient && code) {
            run(code);
        }
    }, [playgroundClient]); // eslint-disable-line react-hooks/exhaustive-deps

    const share = async () => {
        const {
            props: { honeypot: { enabled = false, encryptedValidFrom = '', nameFieldName = '', validFromFieldName = '' } = {} },
        } = page;

        startTransition(() => {
            router.post('/share', {
                code,
                php_version: phpVersion,
                wordpress_version: wordPressVersion,
                [`${nameFieldName}`]: enabled ? '' : undefined,
                [`${validFromFieldName}`]: enabled ? encryptedValidFrom : undefined,
            });
        });
    };

    const canShare = DEFAULT_CODE !== code && (!page.props.share || page.props.share.code !== code);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 shadow-xs md:px-4">
                <div className="flex w-full items-center gap-2 break-words sm:gap-2.5">
                    <a href="/" className="text-foreground hover:text-foreground/80 text-lg">
                        REPL for WordPress
                    </a>

                    <div className="ml-auto hidden flex-row items-center gap-2 md:flex">
                        <span className="text-foreground/80 mr-2 text-sm">
                            Created by{' '}
                            <a
                                href="https://alley.com/"
                                className="hover:*:fill(--alley) underline underline-offset-3 hover:text-(--alley) hover:no-underline dark:decoration-gray-600"
                            >
                                <AlleyLogo className="mr-1 inline-block h-4 w-4 fill-current" />
                                Alley
                            </a>{' '}
                            and powered by{' '}
                            <a
                                href="https://wordpress.github.io/wordpress-playground/"
                                className="underline underline-offset-3 dark:decoration-gray-600 dark:hover:text-gray-100 dark:hover:decoration-gray-300"
                            >
                                WordPress Playground
                            </a>
                        </span>
                        <Button
                            variant="console"
                            size="sm"
                            className={cn('console-button', {
                                'console-button--active': consoleShowing,
                            })}
                            aria-controls="console-panel"
                            onClick={() => dispatch(actionSetConsoleShowing(!consoleShowing))}
                        >
                            {consoleShowing ? 'Hide Console' : 'Show Console'}
                        </Button>
                        <Button
                            variant="console"
                            size="sm"
                            className={cn('console-button', {
                                'console-button--active': browserShowing,
                            })}
                            aria-controls="wp"
                            onClick={() => dispatch(actionSetBrowserShowing(!browserShowing))}
                        >
                            {browserShowing ? 'Hide Browser' : 'Show Browser'}
                        </Button>
                        <Button
                            variant="console"
                            size="sm"
                            className={cx('console-button console-button--active', {
                                'bg-blue-600 dark:bg-blue-600 dark:text-gray-100 hover:dark:bg-blue-700 hover:dark:text-white': DEFAULT_CODE !== code,
                            })}
                            onClick={share}
                            disabled={!canShare || sharing}
                        >
                            {sharing ? 'Sharing...' : 'Share'}
                        </Button>
                        {page.url !== '/' ? (
                            <Button variant="console" size="sm" className="console-button console-button--active" onClick={() => router.get('/')}>
                                New
                            </Button>
                        ) : null}
                    </div>
                </div>
            </header>
            <div className="flex h-full w-full flex-1 flex-col overflow-auto">
                {/* Upper container for the textarea and output */}
                <div
                    className={cn('relative flex h-full flex-row overflow-hidden', {
                        'lg:h-2/3 lg:border-b': browserShowing || consoleShowing,
                        'lg:h-full': !browserShowing && !consoleShowing,
                    })}
                >
                    <EditorPanel />
                    <OutputPanel />
                </div>

                {/* Lower container for the iframe that will allow for a user to resize it to be taller */}
                <div className={cn('flex flex-1', { hidden: !browserShowing && !consoleShowing })}>
                    <div className="flex h-full w-full flex-row">
                        <iframe
                            ref={iframe}
                            className={cn('hidden h-full lg:block', {
                                'lg:hidden': !browserShowing,
                                'lg:w-1/2': browserShowing && consoleShowing,
                                'lg:w-full': browserShowing && !consoleShowing,
                            })}
                            id="wp"
                            title="WordPress Playground"
                        />
                        {consoleShowing ? (
                            <ConsolePanel
                                className={cn('hidden h-full lg:block', {
                                    'lg:hidden': !console,
                                    'lg:w-1/2': browserShowing && consoleShowing,
                                    'lg:w-full': browserShowing && !consoleShowing,
                                })}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            <SettingsPanel />
            <SharePopover />
        </>
    );
}
