export default function MaintenanceOverlay() {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-overlay-title"
            className="bg-background/90 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <div className="bg-card text-card-foreground max-w-md rounded-lg border p-8 text-center shadow-lg">
                <h1 id="maintenance-overlay-title" className="text-xl font-semibold">
                    WordPress Playground isn't working right now
                </h1>
                <p className="text-muted-foreground mt-3">wp-repl will be back soon.</p>
            </div>
        </div>
    );
}
