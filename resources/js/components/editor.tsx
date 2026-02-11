import { useIsDark } from '@/hooks/use-appearance';
import { registerWordPressAutocomplete } from '@/lib/wordpress-autocomplete';
import { default as Monaco } from '@monaco-editor/react';

/**
 * Wrapper for the Monaco Editor component to create a PHP code editor.
 */
export function Editor(props: React.ComponentProps<typeof Monaco>) {
    const isDark = useIsDark();

    const getCssVariable = (name: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(name);
    };

    return (
        <Monaco
            language="php"
            height="100%"
            beforeMount={(monaco) => {
                // Register WordPress autocomplete
                registerWordPressAutocomplete(monaco);

                monaco.editor.defineTheme('custom-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': getCssVariable('--background'),
                    },
                });

                monaco.editor.defineTheme('blueberryLight', {
                    base: 'vs',
                    inherit: true,
                    rules: [
                        { token: '', foreground: '#1A1919', background: '#FFFFFF' }, // Default text, white background
                        { token: 'comment', foreground: '#656A71', fontStyle: 'italic' }, // Comments - Charcoal 4
                        { token: 'keyword', foreground: '#1D35B4', fontStyle: 'bold' }, // Keywords - Dark Blueberry
                        { token: 'string', foreground: '#3858E9' }, // Strings - Blueberry
                        { token: 'number', foreground: '#213FD4' }, // Numbers - Deep Blueberry
                        { token: 'variable', foreground: '#23282D' }, // Variables - Charcoal 2
                        { token: 'type', foreground: '#9FB1FF' }, // Types - Blueberry 2
                        { token: 'function', foreground: '#C7D1FF' }, // Functions - Blueberry 3
                        { token: 'operator', foreground: '#40464D' }, // Operators - Charcoal 3
                    ],
                    colors: {
                        'editor.foreground': '#1A1919', // Charcoal 0 - Default text color
                        'editor.background': '#FFFFFF', // White - Background
                        'editor.selectionBackground': '#D9D9D9AA', // Light Grey (Transparent)
                        'editor.lineHighlightBackground': '#F6F6F6', // Light Grey 2 - Line highlight
                        'editorCursor.foreground': '#1D35B4', // Cursor - Dark Blueberry
                        'editorWhitespace.foreground': '#D9D9D9', // Light Grey - Whitespace
                    },
                });
            }}
            options={{
                fixedOverflowWidgets: true,
                fontFamily: getCssVariable('--font-code'),
                fontSize: 14,
                glyphMargin: false,
                lineHeight: 21,
                padding: {
                    top: 10,
                },
                lineNumbersMinChars: 3,
                minimap: {
                    enabled: false,
                },
                quickSuggestions: {
                    other: true,
                    strings: false,
                },
                wordWrap: 'on',
                wrappingIndent: 'same',
                renderLineHighlight: 'none',
                scrollBeyondLastLine: false,
            }}
            theme={isDark ? 'custom-dark' : 'blueberryLight'}
            width="100%"
            {...props}
        />
    );
}
