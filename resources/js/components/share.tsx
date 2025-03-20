import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { usePage } from '@/hooks/use-page';
import { Transition } from '@headlessui/react';

export function SharePopover() {
    const [copied, setCopied] = useState(false);
    const {
        props: { url: shareUrl },
    } = usePage();
    const [show, setShow] = useState(false);
    const created = localStorage?.getItem('created') === 'true';

    // Remove the created flag from localStorage when the component mounts.
    useEffect(() => {
        if (created) {
            localStorage?.removeItem('created');
            setShow(true);
        }
    }, [created]);

    if (!show || !shareUrl) {
        return null;
    }

    return (
        <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                <Transition show={show}>
                    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition data-[closed]:opacity-0 data-[enter]:transform data-[enter]:duration-300 data-[enter]:ease-out data-[closed]:data-[enter]:translate-y-2 data-[leave]:duration-100 data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0 dark:bg-gray-400 dark:ring-gray-900/20">
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-800">Share created!</p>
                                    <div className="mt-3 flex space-x-7">
                                        <input
                                            // Select the text on focus
                                            onFocus={(e) => {
                                                e.target.select();
                                                e.target.setSelectionRange(0, e.target.value.length);
                                            }}
                                            readOnly
                                            type="text"
                                            value={shareUrl}
                                            className="w-full rounded-md border-gray-300 bg-gray-50 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-200"
                                        />
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-sm font-medium text-blue-600 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-transparent dark:text-gray-700"
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareUrl).then(() => {
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                });
                                            }}
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <div className="ml-4 flex shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShow(false);
                                        }}
                                        className="inline-flex cursor-pointer rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-400 dark:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon aria-hidden="true" className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    );
}
