<?php
/**
 * Home Hero editor script dependencies and cache version.
 *
 * This block uses a directly authored editor script rather than a bundled
 * @wordpress/scripts build, so version it from the source file timestamp.
 */

return array(
    'dependencies' => array(
        'wp-block-editor',
        'wp-blocks',
        'wp-components',
        'wp-element',
        'wp-i18n',
    ),
    'version'      => (string) filemtime( __DIR__ . '/index.js' ),
);
