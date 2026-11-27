<?php
/**
 * Expose saved Contact Details to the contact section and static snapshots.
 *
 * @var array $attributes
 */

$opening_hours = array();
foreach ( $attributes['openingHours'] as $entry ) {
    if ( ! is_array( $entry ) || ! is_string( $entry['days'] ?? null ) || ! is_string( $entry['times'] ?? null ) ) {
        continue;
    }

    $days = trim( $entry['days'] );
    $times = trim( $entry['times'] );
    if ( '' !== $days && '' !== $times ) {
        $opening_hours[] = array( 'days' => $days, 'times' => $times );
    }
}
?>
<div
    <?php echo get_block_wrapper_attributes(); ?>
    data-company-name="<?php echo esc_attr( $attributes['companyName'] ); ?>"
    data-address="<?php echo esc_attr( $attributes['address'] ); ?>"
    data-email="<?php echo esc_attr( $attributes['email'] ); ?>"
    data-telephone="<?php echo esc_attr( $attributes['telephone'] ); ?>"
    data-opening-hours="<?php echo esc_attr( wp_json_encode( $opening_hours ) ); ?>"
></div>
