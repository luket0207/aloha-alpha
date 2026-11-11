<?php
/**
 * WordPress only boots the React build. Layout lives in frontend/src.
 */

add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
} );

add_action( 'wp_enqueue_scripts', function () {
    $manifest_path = get_theme_file_path( 'dist/.vite/manifest.json' );

    if ( ! is_readable( $manifest_path ) ) {
        return; // Run "npm run build" before visiting the public site.
    }

    $manifest = json_decode( file_get_contents( $manifest_path ), true );
    $entry    = $manifest['index.html'] ?? null;

    if ( ! is_array( $entry ) || empty( $entry['file'] ) ) {
        return;
    }

    foreach ( $entry['css'] ?? array() as $index => $css_file ) {
        wp_enqueue_style(
            'alohaalpha-react-' . $index,
            get_theme_file_uri( 'dist/' . $css_file ),
            array(),
            null
        );
    }

    wp_enqueue_script_module(
        'alohaalpha/react',
        get_theme_file_uri( 'dist/' . $entry['file'] ),
        array(),
        null
    );
} );
