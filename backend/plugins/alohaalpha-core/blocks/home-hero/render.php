<?php
/**
 * Dynamic Home Hero markup consumed by the public React integration.
 *
 * @var array $attributes Block attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$slogan = array_key_exists( 'slogan', $attributes )
    ? wp_kses_post( $attributes['slogan'] )
    : 'Aloha starts here';
$images = isset( $attributes['images'] ) && is_array( $attributes['images'] )
    ? $attributes['images']
    : array();

$slides_html = '';
foreach ( $images as $index => $image ) {
    if ( ! is_array( $image ) ) {
        continue;
    }

    $image_id     = absint( $image['id'] ?? 0 );
    $image_url    = esc_url( $image['url'] ?? '' );
    $image_alt    = sanitize_text_field( $image['alt'] ?? '' );
    $image_width  = absint( $image['width'] ?? 0 );
    $image_height = absint( $image['height'] ?? 0 );
    $image_srcset = sanitize_text_field( $image['srcSet'] ?? '' );
    $image_sizes  = sanitize_text_field( $image['sizes'] ?? '(max-width: 767px) 100vw, 68vw' );

    if ( $image_id ) {
        $attachment_source = wp_get_attachment_image_src( $image_id, 'full' );
        $attachment_meta   = wp_get_attachment_metadata( $image_id );
        $attachment_alt    = get_post_meta( $image_id, '_wp_attachment_image_alt', true );

        if ( $attachment_source ) {
            $image_url    = $attachment_source[0];
            $image_width  = absint( $attachment_source[1] );
            $image_height = absint( $attachment_source[2] );
        }
        if ( is_array( $attachment_meta ) ) {
            $image_width  = absint( $attachment_meta['width'] ?? $image_width );
            $image_height = absint( $attachment_meta['height'] ?? $image_height );
        }
        $image_srcset = wp_get_attachment_image_srcset( $image_id, 'full' ) ?: $image_srcset;
        if ( '' !== $attachment_alt ) {
            $image_alt = sanitize_text_field( $attachment_alt );
        }
    }

    if ( ! $image_url ) {
        continue;
    }

    $image_attributes = array(
        'alt'      => $image_alt,
        'class'    => 'aloha-home-hero__image',
        'decoding' => 'async',
        'loading'  => 0 === $index ? 'eager' : 'lazy',
        'sizes'    => $image_srcset ? $image_sizes : '',
        'src'      => $image_url,
        'srcset'   => $image_srcset,
        'width'    => $image_width ?: '',
        'height'   => $image_height ?: '',
    );
    $image_markup = '';
    foreach ( $image_attributes as $name => $value ) {
        if ( '' !== $value ) {
            $image_markup .= sprintf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
        }
    }

    $slides_html .= sprintf(
        '<figure class="aloha-home-hero__slide" data-slide-index="%1$d"><img%2$s></figure>',
        $index,
        $image_markup
    );
}

$wrapper_attributes = get_block_wrapper_attributes(
    array( 'class' => 'aloha-home-hero' )
);
?>
<section <?php echo $wrapper_attributes; ?>>
    <div class="aloha-home-hero__content">
        <?php echo wp_kses_post( alohaalpha_get_large_logo_html() ); ?>
        <h3 class="aloha-home-hero__slogan aloha-heading--latin"><?php echo $slogan; ?></h3>
    </div>
    <div class="aloha-home-hero__slides"><?php echo wp_kses_post( $slides_html ); ?></div>
</section>
