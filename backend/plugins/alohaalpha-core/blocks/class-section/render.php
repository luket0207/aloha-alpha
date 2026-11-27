<?php
/**
 * Publish the Class Section data for the React renderer and static exporter.
 *
 * @var array $attributes
 */

$class_id = $attributes['classId'];
$color_style = $attributes['colorStyle'];
$frame_type = $attributes['frameType'];
$weekdays = array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' );
$time_pattern = '/\A(?:[01][0-9]|2[0-3]):[0-5][0-9]\z/';
$timetable = array();

foreach ( $attributes['timetable'] as $day ) {
    if ( ! is_array( $day ) || ! in_array( $day['weekday'] ?? null, $weekdays, true ) || ! is_array( $day['lessons'] ?? null ) ) {
        continue;
    }

    $lessons = array();
    foreach ( $day['lessons'] as $lesson ) {
        $start = $lesson['start'] ?? null;
        $end = $lesson['end'] ?? null;
        if (
            is_string( $start ) && is_string( $end )
            && preg_match( $time_pattern, $start ) && preg_match( $time_pattern, $end )
            && $end > $start
        ) {
            $lessons[] = array( 'start' => $start, 'end' => $end );
        }
    }

    if ( $lessons ) {
        $weekday = $day['weekday'];
        $timetable[$weekday] = array_merge( $timetable[$weekday] ?? array(), $lessons );
    }
}

$image = '';
$image_id = $attributes['imageId'] ?? 0;
$parent_id = $image_id ? wp_get_post_parent_id( $image_id ) : 0;
$parent = $parent_id ? get_post( $parent_id ) : null;
if (
    $image_id && wp_attachment_is_image( $image_id )
    && 'publish' === get_post_status( $image_id )
    && ( ! $parent || ! $parent->post_password )
) {
    $image = wp_get_attachment_image(
        $image_id,
        'large',
        false,
        array(
            'class'   => 'aloha-image-frame__image',
            'loading' => 'lazy',
            'sizes'   => '(max-width: 767px) 100vw, 50vw',
        )
    );
}

$paragraphs = preg_split( '/\R+/u', $attributes['introduction'], -1, PREG_SPLIT_NO_EMPTY );
?>
<section
    <?php echo get_block_wrapper_attributes(); ?>
    id="<?php echo esc_attr( $class_id ); ?>"
    data-color-style="<?php echo esc_attr( $color_style ); ?>"
    data-timetable="<?php echo esc_attr( wp_json_encode( $timetable ) ); ?>"
>
    <h2><?php echo esc_html( $attributes['title'] ); ?></h2>
    <div class="aloha-class-introduction">
        <?php foreach ( $paragraphs ?: array() as $paragraph ) : ?>
            <?php if ( '' !== trim( $paragraph ) ) : ?>
                <p><?php echo esc_html( trim( $paragraph ) ); ?></p>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
    <?php if ( $image ) : ?>
        <figure data-frame-type="<?php echo esc_attr( $frame_type ); ?>">
            <?php echo $image; ?>
        </figure>
    <?php endif; ?>
</section>
