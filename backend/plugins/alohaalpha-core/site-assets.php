<?php
/**
 * Stable, shared WordPress media references used by public React components.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function alohaalpha_is_public_png_attachment( $id ) {
    if ( 'attachment' !== get_post_type( $id ) || 'image/png' !== get_post_mime_type( $id ) || 'publish' !== get_post_status( $id ) ) {
        return false;
    }

    $parent_id = wp_get_post_parent_id( $id );
    return ! $parent_id || '' === (string) get_post_field( 'post_password', $parent_id, 'raw' );
}

/**
 * Resolve an exact, unique Media Library filename and retain its attachment ID.
 */
function alohaalpha_get_shared_png_id( $filename, $option ) {
    $stored_id = absint( get_option( $option, 0 ) );
    if ( $stored_id && alohaalpha_is_public_png_attachment( $stored_id ) ) {
        return $stored_id;
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
                    'value'   => $filename,
                    'compare' => 'LIKE',
                ),
            ),
        )
    );
    $candidate_ids = array_values(
        array_filter(
            array_map( 'absint', $candidate_ids ),
            static function ( $candidate_id ) use ( $filename ) {
                $attached_file = get_post_meta( $candidate_id, '_wp_attached_file', true );
                return $filename === wp_basename( (string) $attached_file );
            }
        )
    );

    if ( 1 !== count( $candidate_ids ) || ! alohaalpha_is_public_png_attachment( $candidate_ids[0] ) ) {
        return 0;
    }

    update_option( $option, $candidate_ids[0], false );
    return $candidate_ids[0];
}

/**
 * Return the public URL and intrinsic size for a shared image.
 */
function alohaalpha_get_shared_png( $filename, $option ) {
    $attachment_id = alohaalpha_get_shared_png_id( $filename, $option );
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
            'turtle'           => alohaalpha_get_shared_png( 'turtle.png', 'alohaalpha_turtle_attachment_id' ),
            'classDecorations' => array(
                'palmTree'    => alohaalpha_get_shared_png( 'palm-tree.png', 'alohaalpha_palm_tree_attachment_id' ),
                'greenTurtle' => alohaalpha_get_shared_png( 'turtle-g.png', 'alohaalpha_green_turtle_attachment_id' ),
                'surfboard'   => alohaalpha_get_shared_png( 'surfboard.png', 'alohaalpha_surfboard_attachment_id' ),
            ),
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
