<?php
/**
 * Gutenberg starter patterns for AlohaAlpha layout blocks.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Register non-synced starter patterns for the custom layout blocks.
 */
function alohaalpha_register_block_patterns() {
    register_block_pattern_category(
        'aloha-layouts',
        array( 'label' => __( 'Aloha Academy Layouts', 'alohaalpha-core' ) )
    );

    $patterns = array(
        'round-frame' => array(
            'title'       => __( 'Round Frame', 'alohaalpha-core' ),
            'description' => __( 'An independently editable image in an organic round frame.', 'alohaalpha-core' ),
            'content'     => '<!-- wp:aloha/image-frame {"frameType":"round"} /-->',
            'blockTypes'  => array( 'aloha/image-frame' ),
        ),
        'square-frame' => array(
            'title'       => __( 'Square Frame', 'alohaalpha-core' ),
            'description' => __( 'An independently editable image in a softly waved rectangular frame.', 'alohaalpha-core' ),
            'content'     => '<!-- wp:aloha/image-frame {"frameType":"square"} /-->',
            'blockTypes'  => array( 'aloha/image-frame' ),
        ),
        'text-image-side-by-side' => array(
            'title'       => __( 'Text Image — Side by Side', 'alohaalpha-core' ),
            'description' => __( 'A configurable two-column section with an optional title and flexible text content.', 'alohaalpha-core' ),
            'content'     => '<!-- wp:aloha/text-image-side-by-side /-->',
            'blockTypes'  => array( 'aloha/text-image-side-by-side' ),
        ),
        'image-divider' => array(
            'title'       => __( 'Image Divider', 'alohaalpha-core' ),
            'description' => __( 'A full-width image divider ready for Media Library selection.', 'alohaalpha-core' ),
            'content'     => '<!-- wp:aloha/image-divider {"align":"full"} /-->',
            'blockTypes'  => array( 'aloha/image-divider' ),
        ),
    );

    foreach ( $patterns as $name => $pattern ) {
        register_block_pattern(
            'alohaalpha/' . $name,
            array_merge(
                $pattern,
                array(
                    'categories' => array( 'aloha-layouts' ),
                    'inserter'   => true,
                )
            )
        );
    }
}
