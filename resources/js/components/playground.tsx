import { router } from '@inertiajs/react';
import { startPlaygroundWeb, StepDefinition } from '@wp-playground/client';
import { cx } from 'class-variance-authority';
import { useEffect, useRef, useTransition } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useMedia } from 'react-use';

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
    const { code, browserShowing, consoleShowing, multisite, phpVersion, plugins, playgroundClient, ready, themes, wordPressVersion } = state;
    const iframe = useRef<HTMLIFrameElement>(null);
    const isDesktop = useMedia('(min-width: 1024px)', true);

    useEffect(() => {
        if (!ready) {
            return;
        }

        const setupPlayground = async () => {
            const steps: StepDefinition[] = [];

            // Add login step first to ensure user is authenticated before plugin/theme installation
            steps.push({
                step: 'login',
                username: 'admin',
                password: 'password',
            } as StepDefinition);

            if (multisite) {
                steps.push({
                    step: 'enableMultisite',
                });
            }

            // Install plugins via steps if provided
            if (plugins.length > 0) {
                plugins.forEach((plugin) => {
                    steps.push({
                        step: 'installPlugin',
                        pluginData: {
                            resource: 'wordpress.org/plugins',
                            slug: plugin,
                        },
                        options: {
                            activate: true,
                        },
                    } as StepDefinition);
                });
            }

            // Install themes via steps if provided
            if (themes.length > 0) {
                themes.forEach((theme) => {
                    steps.push({
                        step: 'installTheme',
                        themeData: {
                            resource: 'wordpress.org/themes',
                            slug: theme,
                        },
                    } as StepDefinition);
                });
            }

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
                    steps,
                },
                sapiName: 'cli',
            });

            await client.isReady();

            dispatch(actionSetPlaygroundClient(client));
        };

        if (iframe.current) {
            setupPlayground();
        }
    }, [dispatch, iframe, multisite, phpVersion, plugins, ready, themes, wordPressVersion]);

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
            router.post(
                '/share',
                {
                    code,
                    php_version: phpVersion,
                    multisite,
                    plugins,
                    themes,
                    wordpress_version: wordPressVersion,
                    [`${nameFieldName}`]: enabled ? '' : undefined,
                    [`${validFromFieldName}`]: enabled ? encryptedValidFrom : undefined,
                },
                {
                    onSuccess: () => localStorage?.setItem('created', 'true'),
                },
            );
        });
    };

    const canShare = DEFAULT_CODE !== code && (!page.props.share || page.props.share.code !== code);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 shadow-xs md:px-4">
                <div className="flex w-full items-center gap-2 break-words sm:gap-2.5">
                    <h1>
                        <a href="/" className="text-foreground hover:text-foreground/80 text-lg">
                            REPL for WordPress
                        </a>
                    </h1>

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
                {isDesktop && (browserShowing || consoleShowing) ? (
                    // Desktop with browser/console: vertical resizable layout
                    <Group orientation="vertical" className="h-full w-full">
                        <Panel defaultSize="50%" minSize="20%">
                            <div className="flex h-full overflow-hidden">
                                <Group orientation="horizontal" className="h-full w-full">
                                    <Panel defaultSize="50%" minSize="20%">
                                        <EditorPanel />
                                    </Panel>
                                    <Separator className="bg-border w-1 cursor-col-resize transition-colors hover:bg-blue-500 active:bg-blue-600" />
                                    <Panel defaultSize="50%" minSize="20%">
                                        <OutputPanel />
                                    </Panel>
                                </Group>
                            </div>
                        </Panel>
                        <Separator className="bg-border h-1 cursor-row-resize transition-colors hover:bg-blue-500 active:bg-blue-600" />
                        <Panel defaultSize="50%" minSize="20%">
                            <div className="flex h-full w-full flex-row">
                                <iframe
                                    ref={iframe}
                                    className={cn('h-full', {
                                        hidden: !browserShowing,
                                        'w-1/2': browserShowing && consoleShowing,
                                        'w-full': browserShowing && !consoleShowing,
                                    })}
                                    id="wp"
                                    title="WordPress Playground"
                                />
                                <ConsolePanel
                                    className={cn('h-full', {
                                        hidden: !consoleShowing,
                                        'w-1/2': browserShowing && consoleShowing,
                                        'w-full': !browserShowing && consoleShowing,
                                    })}
                                />
                            </div>
                        </Panel>
                    </Group>
                ) : isDesktop ? (
                    // Desktop without browser/console: horizontal resizable layout only
                    <div className="flex h-full overflow-hidden">
                        <Group orientation="horizontal" className="h-full w-full">
                            <Panel defaultSize={50} minSize={20}>
                                <EditorPanel />
                            </Panel>
                            <Separator className="bg-border w-1 cursor-col-resize transition-colors hover:bg-blue-500 active:bg-blue-600" />
                            <Panel defaultSize={50} minSize={20}>
                                <OutputPanel />
                            </Panel>
                        </Group>
                    </div>
                ) : (
                    // Mobile: stacked vertical layout (no resizing)
                    <>
                        <div className="flex h-1/2 w-full flex-col border-b">
                            <EditorPanel />
                        </div>
                        <div className="flex h-1/2 w-full flex-col">
                            <OutputPanel />
                        </div>
                    </>
                )}
            </div>
            <SettingsPanel />
            <SharePopover />
        </>
    );
}
