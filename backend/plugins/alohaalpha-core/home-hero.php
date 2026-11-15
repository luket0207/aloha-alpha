<?php
/**
 * Shared Home Hero helpers for the editor preview and dynamic frontend markup.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
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
