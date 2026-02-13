import { usePlaygroundState } from '@/context/hook';
import { AlertCircle, Loader2 } from 'lucide-react';

export function LoadingOverlay() {
    const { state } = usePlaygroundState();
    const { playgroundError, playgroundReady, ready } = state;

    // Show loading overlay only when ready is true but playgroundReady is false
    const showLoading = ready && !playgroundReady;

    if (!showLoading) {
        return null;
    }

    return (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="mx-4 flex max-w-md flex-col items-center gap-4 text-center">
                {!playgroundError ? (
                    <>
                        <Loader2 className="text-primary h-12 w-12 animate-spin" />
                        <div>
                            <h2 className="text-foreground mb-2 text-xl font-semibold">Preparing WordPress Playground...</h2>
                            <p className="text-muted-foreground text-sm">This may take a few moments while we set up your WordPress environment.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <AlertCircle className="text-destructive h-12 w-12" />
                        <div>
                            <h2 className="text-foreground mb-2 text-xl font-semibold">WordPress Playground Failed to Load</h2>
                            <p className="text-muted-foreground mb-4 text-sm">
                                The WordPress Playground environment is taking longer than expected to load. This could be due to network issues or
                                browser limitations.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
