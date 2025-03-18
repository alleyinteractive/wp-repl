import { Tab, Tabs } from '@/components/tabs';
import { usePlaygroundState } from '@/context/hook';

import { useState } from 'react';

export function OutputPanel() {
    const {
        state: { output },
    } = usePlaygroundState();
    const [tab, setTab] = useState<'pre' | 'html'>('pre');

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
            </Tabs>
            {'pre' === tab ? (
                <pre className="dark:bg-background h-full overflow-auto px-3 pt-2" id="output-pre">
                    {output}
                </pre>
            ) : null}
            {'html' === tab ? (
                // Render with an iframe
                <iframe
                    className="h-full overflow-auto bg-white px-3 pt-2"
                    srcDoc={output}
                    title="Output"
                    sandbox="allow-same-origin allow-scripts"
                    style={{ border: 'none' }}
                    id="output-html"
                />
            ) : null}
        </div>
    );
}
