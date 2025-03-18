import { actionSetError, actionSetExecutionTime, actionSetOutput } from '@/context';
import { usePlaygroundState } from '@/context/hook';

export function useRunCode() {
    const {
        dispatch,
        state: { playgroundClient },
    } = usePlaygroundState();

    return async (code: string) => {
        console.log('run code', code);
        if (!playgroundClient) {
            dispatch(actionSetError('Playground client is not initialized.'));
            dispatch(actionSetOutput(''));
            return;
        }

        // Check that the code starts with <?php
        if (!code.trim().startsWith('<?php')) {
            dispatch(actionSetError('Code must start with "<?php" to be run.'));
            dispatch(actionSetOutput(''));
            return;
        }

        try {
            const startTime = performance.now();
            const response = await playgroundClient.run({ code });
            const endTime = performance.now();

            dispatch(actionSetOutput(response.text));
            dispatch(actionSetExecutionTime(endTime - startTime));
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('error running code', error);
                dispatch(actionSetOutput(error.message));
                dispatch(actionSetExecutionTime(0));
            }
        }
    };
}
