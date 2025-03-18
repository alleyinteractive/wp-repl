import { cn } from '@/lib/utils';
import { logEventType, logger } from '@php-wasm/logger';
import { useEffect, useState } from 'react';

export function ConsolePanel({ className = '' }: { className?: string }) {
    const [logs, setLogs] = useState<string[]>([]);

    // Ported from WordPress Playground directly.
    function getLogs() {
        setLogs(logger.getLogs());
    }

    // Ported from WordPress Playground directly.
    useEffect(() => {
        getLogs();
        logger.addEventListener(logEventType, getLogs);
        return () => {
            logger.removeEventListener(logEventType, getLogs);
        };
    }, []);

    return (
        <div className={cn(className, 'p-5')} id="console-panel">
            <h3 className="mb-3 text-lg font-semibold tracking-tight">Error Console</h3>

            {logs.reverse().map((log, index) => (
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
