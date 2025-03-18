import Playground from '@/components/playground';
import { PlaygroundProvider } from '@/context';

export default function Index() {
    return (
        <main className="flex h-dvh w-dvw flex-col overflow-auto">
            <PlaygroundProvider>
                <Playground />
            </PlaygroundProvider>
        </main>
    );
}
