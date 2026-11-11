<?php
/**
 * Plugin Name: AlohaAlpha Core
 * Description: Place for future custom WordPress features, REST endpoints, and LINE integration.
 * Version: 0.1.0
 * Requires PHP: 8.1
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Expose structured Home hero content through the existing pages REST route.
 * The title and excerpt provide the heading and description; these fields
 * provide the call-to-action label and destination.
 */
add_action( 'init', function () {
    add_post_type_support( 'page', 'excerpt' );

    register_post_meta(
        'page',
        'alohaalpha_hero_button_label',
        array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => function ( $allowed, $meta_key, $post_id ) {
                return current_user_can( 'edit_post', $post_id );
            },
        )
    );

    register_post_meta(
        'page',
        'alohaalpha_hero_button_url',
        array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'esc_url_raw',
            'auth_callback'     => function ( $allowed, $meta_key, $post_id ) {
                return current_user_can( 'edit_post', $post_id );
            },
        )
    );
} );

