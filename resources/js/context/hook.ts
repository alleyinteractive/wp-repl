import { useContext } from 'react';
import { PlaygroundDispatchContext, PlaygroundStateContext } from './context';

export const usePlaygroundState = () => ({
    dispatch: useContext(PlaygroundDispatchContext),
    state: useContext(PlaygroundStateContext),
});
