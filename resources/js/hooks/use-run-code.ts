import { actionSetError, actionSetExecutionTime, actionSetLoading, actionSetOutput } from '@/context';
import { usePlaygroundState } from '@/context/hook';

export function useRunCode() {
    const {
        dispatch,
        state: { playgroundClient },
    } = usePlaygroundState();

    return async (code: string) => {
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

        dispatch(actionSetLoading(true));

        // Inject the WordPress loader into the code.
        code = code.replace(/<\?php/, "<?php require_once '/wordpress/wp-load.php';");

        // Replace the legacy way to include the WordPress loader that was moved
        // in Playground.
        code = code.replace(/'wordpress\/wp-load.php'/, "'/wordpress/wp-load.php'");

        try {
            const startTime = performance.now();
            const response = await playgroundClient.run({
                code,
                headers: {
                    // Set the host header to the playground to ensure that
                    // get_site_by_path() inside of WordPress is able to find
                    // the site properly.
                    host: 'playground.wordpress.net:443',
                },
            });
            const endTime = performance.now();

            if (process.env.NODE_ENV === 'development') {
                console.log('Response from playground:', response);
            }

            if (response.httpStatusCode !== 200) {
                console.log('Potential error in response', response);
            }

            dispatch(actionSetOutput(response.text));
            dispatch(actionSetExecutionTime(endTime - startTime));
        } catch (error: unknown) {
            console.error('error running code', error);

            if (error instanceof Error) {
                dispatch(actionSetOutput(error.message));
                dispatch(actionSetExecutionTime(0));
            }
        }
    };
}
