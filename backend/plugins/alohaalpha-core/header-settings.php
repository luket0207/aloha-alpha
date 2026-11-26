<?php
/**
 * Gutenberg and render-time support for the synced Header and Footer colours.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const ALOHAALPHA_DEFAULT_HEADER_COLOUR = 'dark-green';
const ALOHAALPHA_DEFAULT_FOOTER_COLOUR = 'light-blue';

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
 * Restrict stored Footer colours to the three supported design variants.
 */
function alohaalpha_normalize_footer_colour( $value ) {
    $supported_colours = array( 'light-blue', 'dark-blue', 'green' );
    $value             = sanitize_key( (string) $value );

    return in_array( $value, $supported_colours, true )
        ? $value
        : ALOHAALPHA_DEFAULT_FOOTER_COLOUR;
}

/**
 * Register colour attributes on the existing core Group wrappers.
 */
function alohaalpha_register_section_colour_attributes( $args, $block_type ) {
    if ( 'core/group' !== $block_type ) {
        return $args;
    }

    $args['attributes'] = $args['attributes'] ?? array();
    $args['attributes']['alohaHeaderColour'] = array(
        'type'    => 'string',
        'default' => ALOHAALPHA_DEFAULT_HEADER_COLOUR,
    );
    $args['attributes']['alohaFooterColour'] = array(
        'type'    => 'string',
        'default' => ALOHAALPHA_DEFAULT_FOOTER_COLOUR,
    );

    return $args;
}
add_filter( 'register_block_type_args', 'alohaalpha_register_section_colour_attributes', 10, 2 );

/**
 * Expose the selected colours on the rendered section wrappers.
 */
function alohaalpha_render_section_colours( $block_content, $block ) {
    if ( 'core/group' !== ( $block['blockName'] ?? '' ) ) {
        return $block_content;
    }

    $class_name = (string) ( $block['attrs']['className'] ?? '' );
    $classes    = preg_split( '/\s+/', trim( $class_name ) );
    $is_header  = in_array( 'aloha-header', $classes, true );
    $is_footer  = in_array( 'aloha-footer', $classes, true );
    if ( ! $is_header && ! $is_footer ) {
        return $block_content;
    }

    $processor = new WP_HTML_Tag_Processor( $block_content );
    if ( ! $processor->next_tag() ) {
        return $block_content;
    }

    if ( $is_header ) {
        $processor->set_attribute(
            'data-aloha-header-colour',
            alohaalpha_normalize_header_colour( $block['attrs']['alohaHeaderColour'] ?? '' )
        );
    }

    if ( $is_footer ) {
        $processor->set_attribute(
            'data-aloha-footer-colour',
            alohaalpha_normalize_footer_colour( $block['attrs']['alohaFooterColour'] ?? '' )
        );
    }

    return $processor->get_updated_html();
}
add_filter( 'render_block_core/group', 'alohaalpha_render_section_colours', 10, 2 );
