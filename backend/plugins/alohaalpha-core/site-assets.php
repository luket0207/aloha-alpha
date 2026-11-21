<?php
/**
 * Stable, shared WordPress media references used by public React components.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const ALOHAALPHA_TURTLE_OPTION = 'alohaalpha_turtle_attachment_id';

/**
 * Resolve the unique turtle.png attachment once, then retain its stable ID.
 */
function alohaalpha_get_turtle_attachment_id() {
    static $attachment_id = null;

    if ( null !== $attachment_id ) {
        return $attachment_id;
    }

    $stored_id = absint( get_option( ALOHAALPHA_TURTLE_OPTION, 0 ) );
    if ( $stored_id && 'attachment' === get_post_type( $stored_id ) && wp_attachment_is_image( $stored_id ) ) {
        $attachment_id = $stored_id;
        return $attachment_id;
    }

    $candidate_ids = get_posts(
        array(
            'post_type'      => 'attachment',
            'post_status'    => 'inherit',
            'post_mime_type' => 'image/png',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'     => '_wp_attached_file',
                    'value'   => 'turtle.png',
                    'compare' => 'LIKE',
                ),
            ),
        )
    );
    $candidate_ids = array_values(
        array_filter(
            array_map( 'absint', $candidate_ids ),
            static function ( $candidate_id ) {
                $attached_file = get_post_meta( $candidate_id, '_wp_attached_file', true );
                return 'turtle.png' === wp_basename( (string) $attached_file );
            }
        )
    );

    $attachment_id = 1 === count( $candidate_ids ) ? $candidate_ids[0] : 0;
    if ( $attachment_id ) {
        update_option( ALOHAALPHA_TURTLE_OPTION, $attachment_id, false );
    }

    return $attachment_id;
}

/**
 * Return only the public image data needed for the decorative turtle.
 */
function alohaalpha_get_turtle_data() {
    $attachment_id = alohaalpha_get_turtle_attachment_id();
    if ( ! $attachment_id ) {
        return null;
    }

    $source = wp_get_attachment_image_src( $attachment_id, 'full' );
    if ( ! $source ) {
        return null;
    }

    return array(
        'id'     => $attachment_id,
        'url'    => $source[0],
        'width'  => absint( $source[1] ),
        'height' => absint( $source[2] ),
    );
}

/**
 * Expose shared public media references through one narrow REST contract.
 */
function alohaalpha_get_site_assets() {
    return rest_ensure_response(
        array(
            'turtle' => alohaalpha_get_turtle_data(),
        )
    );
}

add_action( 'rest_api_init', function () {
    register_rest_route(
        'aloha/v1',
        '/site-assets',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'alohaalpha_get_site_assets',
            'permission_callback' => '__return_true',
        )
    );
} );
