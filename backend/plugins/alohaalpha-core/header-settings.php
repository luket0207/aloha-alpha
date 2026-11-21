<?php
/**
 * Gutenberg and render-time support for the synced Header colour setting.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const ALOHAALPHA_DEFAULT_HEADER_COLOUR = 'dark-green';

/**
 * Restrict stored Header colours to the three supported design variants.
 */
function alohaalpha_normalize_header_colour( $value ) {
    $supported_colours = array( 'dark-green', 'green', 'dark-blue' );
    $value             = sanitize_key( (string) $value );

    return in_array( $value, $supported_colours, true )
        ? $value
        : ALOHAALPHA_DEFAULT_HEADER_COLOUR;
}

/**
 * Register the custom attribute on core Group blocks without replacing the
 * existing synced Header pattern or its block structure.
 */
function alohaalpha_register_header_colour_attribute( $args, $block_type ) {
    if ( 'core/group' !== $block_type ) {
        return $args;
    }

    $args['attributes']                              = $args['attributes'] ?? array();
    $args['attributes']['alohaHeaderColour'] = array(
        'type'    => 'string',
        'default' => ALOHAALPHA_DEFAULT_HEADER_COLOUR,
    );

    return $args;
}
add_filter( 'register_block_type_args', 'alohaalpha_register_header_colour_attribute', 10, 2 );

/**
 * Add a stable, explicit data contract to the rendered Header wrapper.
 */
function alohaalpha_render_header_colour( $block_content, $block ) {
    if ( 'core/group' !== ( $block['blockName'] ?? '' ) ) {
        return $block_content;
    }

    $class_name = (string) ( $block['attrs']['className'] ?? '' );
    $classes    = preg_split( '/\s+/', trim( $class_name ) );
    if ( ! in_array( 'aloha-header', $classes, true ) ) {
        return $block_content;
    }

    $processor = new WP_HTML_Tag_Processor( $block_content );
    if ( ! $processor->next_tag() ) {
        return $block_content;
    }

    $processor->set_attribute(
        'data-aloha-header-colour',
        alohaalpha_normalize_header_colour( $block['attrs']['alohaHeaderColour'] ?? '' )
    );

    return $processor->get_updated_html();
}
add_filter( 'render_block_core/group', 'alohaalpha_render_header_colour', 10, 2 );
