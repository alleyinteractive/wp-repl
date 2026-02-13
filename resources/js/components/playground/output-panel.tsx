import { Tab, Tabs } from '@/components/tabs';
import { WelcomePanel } from '@/components/welcome-panel';
import { DEFAULT_CODE } from '@/context';
import { usePlaygroundState } from '@/context/hook';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OutputPanel() {
    const {
        state: { output, loading, code, playgroundReady, ready },
    } = usePlaygroundState();
    const [tab, setTab] = useState<'pre' | 'html'>('pre');
    const [playgroundError, setPlaygroundError] = useState(false);

    useEffect(() => {
        // Check for HTML by looking for common tags, excluding <br> and <br/>
        const hasHTML =
            output &&
            (/<!DOCTYPE html>/i.test(output) ||
                /<(html|head|body|div|span|p|h[1-6]|ul|ol|li|table|form|input|button|a|img|section|article|nav|header|footer|main)\b/i.test(output));
        if (hasHTML) {
            setTab('html');
        }
    }, [output]);

    useEffect(() => {
        if (!ready || playgroundReady) {
            setPlaygroundError(false);
            return;
        }

        // If still loading after 60 seconds, show error
        const timer = setTimeout(() => {
            if (!playgroundReady) {
                setPlaygroundError(true);
            }
        }, 60000);

        return () => clearTimeout(timer);
    }, [ready, playgroundReady]);

    const showWelcome = code === DEFAULT_CODE;
    const showPlaygroundLoading = ready && !playgroundReady;

    return (
        <div
            // This panel keeps overflowing. The absolute positioning is needed
            // to keep it on the right side of the screen. Maybe there is a
            // better solution.
            className="absolute top-0 right-0 bottom-0 flex w-1/2 flex-col overflow-hidden"
        >
            <Tabs className="border-gray-100 pl-3 dark:border-gray-900 dark:bg-gray-950">
                <Tab label="Output" onSelect={() => setTab('pre')} current={'pre' === tab} aria-controls="output-pre" />
                <Tab label="HTML" onSelect={() => setTab('html')} current={'html' === tab} aria-controls="output-html" />
                {loading ? (
                    <div className="ml-auto flex items-center">
                        <div role="status">
                            <svg
                                aria-hidden="true"
                                className="mr-3 h-6 w-6 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentFill"
                                />
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : null}
            </Tabs>
            <div className="relative flex-1 overflow-hidden">
                {'pre' === tab ? (
                    <>
                        <div className="dark:bg-background h-full overflow-auto px-3 pt-2">
                            {showPlaygroundLoading && !playgroundError ? (
                                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                    <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Preparing WordPress Playground...</h3>
                                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                            Setting up your WordPress environment. This may take a few moments.
                                        </p>
                                    </div>
                                </div>
                            ) : playgroundError ? (
                                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">WordPress Playground Failed to Load</h3>
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            The WordPress environment is taking longer than expected to load. This could be due to network issues or
                                            browser limitations.
                                        </p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-2 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                        >
                                            Reload Page
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <pre id="output-pre">
                                    {output}
                                    {!loading && !output ? 'No output produced.' : null}
                                </pre>
                            )}
                        </div>
                    </>
                ) : null}
                {'html' === tab ? (
                    // Render with an iframe
                    <iframe
                        className="h-full w-full overflow-auto bg-white px-3 pt-2"
                        srcDoc={output}
                        title="Output"
                        sandbox="allow-same-origin allow-scripts"
                        style={{ border: 'none' }}
                        id="output-html"
                    />
                ) : null}
                {showWelcome && 'pre' === tab && playgroundReady ? <WelcomePanel /> : null}
            </div>
        </div>
    );
}
