<?php
/**
 * Shared Home Hero helpers for the editor preview and dynamic frontend markup.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const ALOHAALPHA_ROUND_LOGO_OPTION = 'alohaalpha_round_logo_attachment_id';

/**
 * Resolve logo.png once, then retain its stable Media Library attachment ID.
 */
function alohaalpha_get_round_logo_attachment_id() {
    static $attachment_id = null;

    if ( null !== $attachment_id ) {
        return $attachment_id;
    }

    $stored_id = absint( get_option( ALOHAALPHA_ROUND_LOGO_OPTION, 0 ) );
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
                    'value'   => 'logo.png',
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
                return 'logo.png' === wp_basename( (string) $attached_file );
            }
        )
    );

    $attachment_id = 1 === count( $candidate_ids ) ? $candidate_ids[0] : 0;
    if ( $attachment_id ) {
        update_option( ALOHAALPHA_ROUND_LOGO_OPTION, $attachment_id, false );
    }

    return $attachment_id;
}

/**
 * Return the centrally managed Round Logo data for Gutenberg previews.
 */
function alohaalpha_get_round_logo_data() {
    $attachment_id = alohaalpha_get_round_logo_attachment_id();
    if ( ! $attachment_id ) {
        return null;
    }

    $source = wp_get_attachment_image_src( $attachment_id, 'full' );
    if ( ! $source ) {
        return null;
    }

    $alt = trim( (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ) );

    return array(
        'id'     => $attachment_id,
        'url'    => $source[0],
        'width'  => absint( $source[1] ),
        'height' => absint( $source[2] ),
        'alt'    => $alt ?: 'Aloha Academy',
    );
}

/**
 * Find the first Large Aloha Logo in a parsed block tree.
 */
function alohaalpha_find_large_logo_block( array $blocks ) {
    foreach ( $blocks as $block ) {
        if (
            'aloha/logo' === ( $block['blockName'] ?? '' )
            && 'large' === ( $block['attrs']['variant'] ?? 'small' )
        ) {
            return $block;
        }

        if ( ! empty( $block['innerBlocks'] ) ) {
            $nested_logo = alohaalpha_find_large_logo_block( $block['innerBlocks'] );
            if ( $nested_logo ) {
                return $nested_logo;
            }
        }
    }

    return null;
}

/**
 * Render the existing WordPress-managed synced Large Logo source.
 */
function alohaalpha_get_large_logo_html() {
    $synced_patterns = get_posts(
        array(
            'post_type'      => 'wp_block',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'ID',
            'order'          => 'ASC',
        )
    );

    foreach ( $synced_patterns as $synced_pattern ) {
        $logo_block = alohaalpha_find_large_logo_block( parse_blocks( $synced_pattern->post_content ) );
        if ( $logo_block ) {
            return render_block( $logo_block );
        }
    }

    return '';
}

/**
 * Add the established Aloha layouts category to the block inserter.
 */
function alohaalpha_register_block_category( array $categories ) {
    foreach ( $categories as $category ) {
        if ( 'aloha-layouts' === ( $category['slug'] ?? '' ) ) {
            return $categories;
        }
    }

    array_unshift(
        $categories,
        array(
            'slug'  => 'aloha-layouts',
            'title' => __( 'Aloha Academy Layouts', 'alohaalpha-core' ),
        )
    );

    return $categories;
}
add_filter( 'block_categories_all', 'alohaalpha_register_block_category' );
