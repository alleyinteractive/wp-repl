import { usePlaygroundState } from '@/context/hook';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const errorLogPath = '/wordpress/wp-content/debug.log';

export function ConsolePanel({ className = '' }: { className?: string }) {
    const {
        state: { playgroundClient, ready },
    } = usePlaygroundState();
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (!ready || !playgroundClient) {
            return;
        }

        playgroundClient.addEventListener('request.end', async () => {
            if (!(await playgroundClient.fileExists(errorLogPath))) {
                return;
            }

            const contents = await playgroundClient.readFileAsText(errorLogPath);

            setLogs(
                contents
                    .split('\n')
                    .filter(Boolean)
                    .filter((log, index, self) => self.indexOf(log) === index)
                    .reverse(),
            );
        });
    }, [playgroundClient, ready]);

    return (
        <div className={cn(className, 'overflow-y-scroll p-5')} id="console-panel">
            <h3 className="mb-3 text-lg font-semibold tracking-tight">Error Console</h3>

            {logs.map((log, index) => (
                <div
                    className="my-2 border-b border-dashed py-2 font-mono break-words whitespace-pre-wrap"
                    key={index}
                    dangerouslySetInnerHTML={{
                        __html: log.replace(/Error:|Fatal:/, '<mark>$&</mark>'),
                    }}
                />
            ))}

            {!logs.length ? (
                <p>
                    Error logs for Playground, WordPress, and PHP will show up here when something goes wrong.
                    <br />
                    <br />
                    No problems so far – yay! 🎉
                </p>
            ) : null}
        </div>
    );
}
