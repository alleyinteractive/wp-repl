import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SupportedPHPVersionsList } from '@php-wasm/universal';
import type { SupportedPHPVersion } from '@wp-playground/client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { actionSetSettingsOpen, actionSetState, PlaygroundContextType } from '@/context';
import { usePlaygroundState } from '@/context/hook';
import { DEFAULT_PHP_VERSION } from '@/lib/constants';

export function SettingsPanel() {
    const [localPhpVersion, setLocalPhpVersion] = useState<SupportedPHPVersion | 'latest'>('latest');
    const [localWordPressVersion, setLocalWordPressVersion] = useState<PlaygroundContextType['wordPressVersion']>('latest');
    const [localMultisite, setLocalMultisite] = useState<boolean>(false);

    const [supportedWPVersions, setSupportedWPVersions] = useState<Record<string, string>>({});
    const [latestWPVersion, setLatestWPVersion] = useState<string | null>(null);

    const {
        dispatch,
        state: { phpVersion, playgroundClient, wordPressVersion, multisite, settingsOpen: open },
    } = usePlaygroundState();

    useEffect(() => {
        playgroundClient?.getMinifiedWordPressVersions().then(({ all, latest }) => {
            const formOptions: Record<string, string> = {};
            for (const version of Object.keys(all)) {
                if (version === 'beta') {
                    // Don't show beta versions related to supported major releases
                    if (!(all.beta.substring(0, 3) in all)) {
                        formOptions[version] = all.beta;
                    }
                } else {
                    formOptions[version] = version;
                }
            }
            setSupportedWPVersions(formOptions);
            setLatestWPVersion(latest);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!playgroundClient]);

    // Set the local state for PHP and WordPress versions when the component
    // mounts or when the global state changes.
    useEffect(() => {
        setLocalMultisite(multisite);
        setLocalPhpVersion(phpVersion);
        setLocalWordPressVersion(wordPressVersion);
    }, [multisite, phpVersion, wordPressVersion]);

    const onClose = () => dispatch(actionSetSettingsOpen(false));
    const applySettings = () => {
        dispatch(
            actionSetState({
                loading: true,
                multisite: localMultisite,
                phpVersion: localPhpVersion as SupportedPHPVersion,
                settingsOpen: false,
                wordPressVersion: localWordPressVersion,
            }),
        );
    };

    return (
        <Dialog open={open} onClose={onClose} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0 dark:bg-gray-800/50"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <DialogPanel
                            transition
                            className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
                        >
                            <TransitionChild>
                                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-[closed]:opacity-0 sm:-ml-10 sm:pr-4">
                                    <button
                                        type="button"
                                        onClick={() => onClose()}
                                        className="relative rounded-md text-gray-300 hover:text-white focus:ring-2 focus:ring-white focus:outline-none"
                                    >
                                        <span className="absolute -inset-2.5" />
                                        <span className="sr-only">Close panel</span>
                                        <XMarkIcon aria-hidden="true" className="size-6" />
                                    </button>
                                </div>
                            </TransitionChild>
                            <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl dark:bg-gray-950">
                                <div className="px-4 sm:px-6">
                                    <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">Sandbox Settings</DialogTitle>
                                </div>
                                <div className="space-y-3 px-4 pt-3 sm:px-6">
                                    <Label htmlFor="phpVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        PHP Version
                                    </Label>
                                    <select
                                        id="phpVersion"
                                        name="phpVersion"
                                        className="w-full rounded-sm border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        defaultValue={localPhpVersion}
                                        onChange={(e) => setLocalPhpVersion(e.target.value as SupportedPHPVersion)}
                                    >
                                        {SupportedPHPVersionsList.map((version) => (
                                            <option key={version} value={version}>
                                                {version} {version === DEFAULT_PHP_VERSION ? '(default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3 px-4 pt-3 sm:px-6">
                                    <Label htmlFor="wordPressVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        WordPress Version
                                    </Label>
                                    <select
                                        id="wordPressVersion"
                                        name="wordPressVersion"
                                        className="w-full rounded-sm border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        defaultValue={localWordPressVersion}
                                        onChange={(e) => setLocalWordPressVersion(e.target.value as PlaygroundContextType['wordPressVersion'])}
                                    >
                                        <option value="latest">Latest</option>
                                        {Object.entries(supportedWPVersions).map(([version, label]) => (
                                            <option key={version} value={version}>
                                                {label}
                                                {version === latestWPVersion ? ' (latest)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3 px-4 pt-3 sm:px-6">
                                    <input
                                        id="multisite"
                                        name="multisite"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        checked={localMultisite}
                                        onChange={(e) => setLocalMultisite(e.target.checked)}
                                    />
                                    <Label htmlFor="multisite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Enable a Multisite Network
                                    </Label>
                                </div>
                                <div className="mt-5 space-y-5 border-t px-4 pt-5">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Destructive action! Applying these settings will reset the WordPress site to its initial state.
                                    </p>
                                    <Button type="button" onClick={() => applySettings()} className="w-full cursor-pointer dark:text-white">
                                        Apply Settings &amp; Reset Playground
                                    </Button>
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
