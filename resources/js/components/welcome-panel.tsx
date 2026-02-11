import { actionSetCode } from '@/context';
import { usePlaygroundState } from '@/context/hook';
import { cn } from '@/lib/utils';
import { Blocks, Code, Database, FileText, Filter, Search } from 'lucide-react';

interface Example {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    code: string;
}

const EXAMPLES: Example[] = [
    {
        icon: Search,
        title: 'Query Posts',
        description: 'Fetch and display posts with WP_Query',
        code: `<?php
/**
 * Query and display the latest posts
 */
$query = new WP_Query([
    'post_type' => 'post',
    'posts_per_page' => 5,
    'orderby' => 'date',
    'order' => 'DESC',
]);

if ($query->have_posts()) {
    echo '<h2>Latest Posts:</h2>';
    echo '<ul>';
    while ($query->have_posts()) {
        $query->the_post();
        echo '<li>' . get_the_title() . ' (' . get_the_date() . ')</li>';
    }
    echo '</ul>';
    wp_reset_postdata();
} else {
    echo 'No posts found.';
}
`,
    },
    {
        icon: Filter,
        title: 'Add Filter',
        description: 'Modify content with a WordPress filter',
        code: `<?php
/**
 * Add a filter to modify post content
 */
add_filter('the_content', function($content) {
    // Add a custom message before the content
    $message = '<div style="padding: 10px; background: #f0f0f0; border-left: 3px solid #0073aa;">';
    $message .= '<strong>Note:</strong> This content has been filtered!';
    $message .= '</div>';

    return $message . $content;
});

// Test it with sample content
$test_content = '<p>This is the original post content.</p>';
echo apply_filters('the_content', $test_content);
`,
    },
    {
        icon: FileText,
        title: 'Create Shortcode',
        description: 'Register and use a custom shortcode',
        code: `<?php
/**
 * Create a simple shortcode
 */
add_shortcode('hello', function($atts) {
    $atts = shortcode_atts([
        'name' => 'World',
    ], $atts);

    return '<strong>Hello, ' . esc_html($atts['name']) . '!</strong>';
});

// Test the shortcode
echo '<h3>Testing Shortcode:</h3>';
echo do_shortcode('[hello name="WordPress"]');
echo '<br>';
echo do_shortcode('[hello]');
`,
    },
    {
        icon: Database,
        title: 'Database Query',
        description: 'Interact with the WordPress database',
        code: `<?php
/**
 * Perform a custom database query
 */
global $wpdb;

// Get the latest 5 posts directly from the database
$posts = $wpdb->get_results("
    SELECT ID, post_title, post_date
    FROM {$wpdb->posts}
    WHERE post_status = 'publish'
    AND post_type = 'post'
    ORDER BY post_date DESC
    LIMIT 5
");

echo '<h3>Latest Posts (via $wpdb):</h3>';
echo '<ul>';
foreach ($posts as $post) {
    echo '<li>' . esc_html($post->post_title) . ' (' . $post->post_date . ')</li>';
}
echo '</ul>';
`,
    },
    {
        icon: Code,
        title: 'REST API',
        description: 'Work with the WordPress REST API',
        code: `<?php
/**
 * Fetch data from the WordPress REST API
 */
$request = new WP_REST_Request('GET', '/wp/v2/posts');
$request->set_query_params([
    'per_page' => 5,
    'orderby' => 'date',
]);

$response = rest_do_request($request);
$server = rest_get_server();
$data = $server->response_to_data($response, false);

echo '<h3>Posts via REST API:</h3>';
echo '<pre>';
echo json_encode($data, JSON_PRETTY_PRINT);
echo '</pre>';
`,
    },
    {
        icon: Blocks,
        title: 'Register Block Type',
        description: 'Register a custom Gutenberg block',
        code: `<?php
/**
 * Register a simple custom block
 */
register_block_type('my-plugin/example-block', [
    'api_version' => 2,
    'title' => 'Example Block',
    'category' => 'text',
    'render_callback' => function($attributes, $content) {
        return '<div class="my-example-block">' .
               '<h3>Custom Block</h3>' .
               '<p>This is a custom Gutenberg block!</p>' .
               '</div>';
    },
]);

// Display block info
$registered_blocks = get_dynamic_block_names();
echo '<h3>Dynamic Blocks:</h3>';
echo '<pre>' . print_r(array_filter($registered_blocks, function($block) {
    return strpos($block, 'my-plugin') !== false;
}), true) . '</pre>';
`,
    },
];

export function WelcomePanel() {
    const { dispatch } = usePlaygroundState();
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? 'Cmd' : 'Ctrl';

    const loadExample = (code: string) => {
        dispatch(actionSetCode(code));
    };

    return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col overflow-auto">
            {/* Welcome content */}
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="pointer-events-auto w-full max-w-4xl">
                    <div className="mb-6 text-center">
                        <h2 className="text-foreground text-2xl font-semibold">Welcome to REPL for WordPress!</h2>
                        <p className="text-muted-foreground mt-2 text-sm">Get started with one of these examples, or start coding your own</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {EXAMPLES.map((example) => (
                            <button
                                key={example.title}
                                onClick={() => loadExample(example.code)}
                                className={cn(
                                    'group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                                    'hover:border-primary hover:bg-accent hover:shadow-md',
                                    'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <example.icon className="text-muted-foreground group-hover:text-primary h-5 w-5" />
                                    <h3 className="text-foreground font-medium">{example.title}</h3>
                                </div>
                                <p className="text-muted-foreground text-xs">{example.description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-xs">
                            Press <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">{modifierKey} + Enter</kbd> to run the code
                            in the editor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
