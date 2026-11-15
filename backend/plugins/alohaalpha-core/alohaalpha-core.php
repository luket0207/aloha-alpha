<?php
/**
 * Plugin Name: AlohaAlpha Core
 * Description: Aloha Academy Gutenberg blocks, editor design tools, and public section API.
 * Version: 0.2.0
 * Requires PHP: 8.1
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ALOHAALPHA_CORE_VERSION', '0.2.0' );

require_once __DIR__ . '/contact-api.php';
require_once __DIR__ . '/home-hero.php';
require_once __DIR__ . '/patterns.php';

/**
 * Load the three approved typefaces in the editor canvas only.
 */
function alohaalpha_enqueue_editor_styles() {
    wp_enqueue_style(
        'alohaalpha-google-fonts',
        'https://fonts.googleapis.com/css2?family=Leckerli+One&family=Mochiy+Pop+P+One&family=Zen+Maru+Gothic:wght@400;700&display=swap',
        array(),
        null
    );

    wp_enqueue_style(
        'alohaalpha-editor-typography',
        plugins_url( 'assets/css/editor-typography.css', __FILE__ ),
        array( 'alohaalpha-google-fonts' ),
        ALOHAALPHA_CORE_VERSION
    );
}
add_action( 'enqueue_block_assets', function () {
    if ( is_admin() ) {
        alohaalpha_enqueue_editor_styles();
    }
} );

/**
 * Register the native Heading block variations in Gutenberg.
 */
add_action( 'enqueue_block_editor_assets', function () {
    wp_enqueue_script(
        'alohaalpha-heading-variations',
        plugins_url( 'assets/js/editor-variations.js', __FILE__ ),
        array( 'wp-blocks', 'wp-dom-ready', 'wp-i18n' ),
        ALOHAALPHA_CORE_VERSION,
        true
    );
} );

/**
 * Register custom blocks from their metadata so scripts and styles load only
 * when WordPress needs them.
 */
add_action( 'init', function () {
    $block_directories = array(
        'logo',
        'image-frame',
        'image-divider',
        'text-image-media',
        'text-image-content',
        'text-image-side-by-side',
        'home-hero',
    );

    foreach ( $block_directories as $block_directory ) {
        $block_type = register_block_type( __DIR__ . '/blocks/' . $block_directory );

        if ( 'home-hero' === $block_directory && $block_type instanceof WP_Block_Type && is_admin() ) {
            $editor_settings = wp_json_encode(
                array( 'logoHtml' => alohaalpha_get_large_logo_html() ),
                JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
            );

            foreach ( $block_type->editor_script_handles as $script_handle ) {
                wp_add_inline_script(
                    $script_handle,
                    'window.alohaalphaHomeHeroEditor = ' . $editor_settings . ';',
                    'before'
                );
            }
        }
    }

    alohaalpha_register_block_patterns();
} );

/**
 * Map public section names to the actual synced-pattern slugs in WordPress.
 * Contact Us - Full was saved with the shorter "contact-us" post slug.
 */
function alohaalpha_section_pattern_slugs() {
    return array(
        'header'          => 'header',
        'footer'          => 'footer',
        'contact-us-full' => 'contact-us',
        'contact-us-jump' => 'contact-us-jump',
    );
}

/**
 * Return one approved, published synced pattern as rendered block HTML.
 */
function alohaalpha_get_section( WP_REST_Request $request ) {
    $requested_slug = sanitize_key( $request['slug'] );
    $allowed_slugs  = alohaalpha_section_pattern_slugs();

    if ( ! isset( $allowed_slugs[ $requested_slug ] ) ) {
        return new WP_Error(
            'alohaalpha_section_not_found',
            'Section not found.',
            array( 'status' => 404 )
        );
    }

    $section = get_page_by_path( $allowed_slugs[ $requested_slug ], OBJECT, 'wp_block' );

    if ( ! $section instanceof WP_Post || 'publish' !== $section->post_status ) {
        return new WP_Error(
            'alohaalpha_section_not_found',
            'Section not found.',
            array( 'status' => 404 )
        );
    }

    $previous_post   = $GLOBALS['post'] ?? null;
    $GLOBALS['post'] = $section;
    setup_postdata( $section );

    try {
        $html = wp_kses_post( do_blocks( $section->post_content ) );
    } finally {
        if ( $previous_post instanceof WP_Post ) {
            $GLOBALS['post'] = $previous_post;
            setup_postdata( $previous_post );
        } else {
            wp_reset_postdata();
            unset( $GLOBALS['post'] );
        }
    }

    return rest_ensure_response(
        array(
            'slug' => $requested_slug,
            'html' => $html,
        )
    );
}

add_action( 'rest_api_init', function () {
    register_rest_route(
        'aloha/v1',
        '/sections/(?P<slug>[a-z0-9-]+)',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'alohaalpha_get_section',
            'permission_callback' => '__return_true',
        )
    );
} );
