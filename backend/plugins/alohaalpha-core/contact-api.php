<?php
/**
 * Public Contact Us REST endpoint.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ALOHAALPHA_CONTACT_RECIPIENT', 'lturnbull2@hotmail.co.uk' );
define( 'ALOHAALPHA_CONTACT_MAX_PAYLOAD_BYTES', 8192 );
define( 'ALOHAALPHA_CONTACT_RATE_LIMIT', 5 );
define( 'ALOHAALPHA_CONTACT_RATE_WINDOW', 10 * MINUTE_IN_SECONDS );

/**
 * Return the character length of a UTF-8 string.
 */
function alohaalpha_contact_length( $value ) {
    return function_exists( 'mb_strlen' ) ? mb_strlen( $value, 'UTF-8' ) : strlen( $value );
}

/**
 * Build a privacy-preserving throttle key from the direct client address.
 */
function alohaalpha_contact_rate_key() {
    $address = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
    return 'aloha_contact_rate_' . hash_hmac( 'sha256', $address, wp_salt( 'auth' ) );
}

/**
 * Count public requests without storing a raw IP address.
 */
function alohaalpha_contact_apply_rate_limit() {
    $key    = alohaalpha_contact_rate_key();
    $record = get_transient( $key );

    if ( ! is_array( $record ) ) {
        $record = array( 'count' => 0 );
    }

    if ( $record['count'] >= ALOHAALPHA_CONTACT_RATE_LIMIT ) {
        return new WP_Error(
            'alohaalpha_contact_rate_limited',
            '送信回数が多すぎます。時間をおいてもう一度お試しください。',
            array( 'status' => 429 )
        );
    }

    $record['count']++;
    set_transient( $key, $record, ALOHAALPHA_CONTACT_RATE_WINDOW );

    return true;
}

/**
 * Return a validation error without reflecting submitted content.
 */
function alohaalpha_contact_validation_error( $code, $message ) {
    return new WP_Error( $code, $message, array( 'status' => 400 ) );
}

/**
 * Validate, sanitize and send one contact request as plain text.
 */
function alohaalpha_handle_contact_request( WP_REST_Request $request ) {
    $raw_body = $request->get_body();

    if ( strlen( $raw_body ) > ALOHAALPHA_CONTACT_MAX_PAYLOAD_BYTES ) {
        return new WP_Error(
            'alohaalpha_contact_payload_too_large',
            '送信内容が大きすぎます。',
            array( 'status' => 413 )
        );
    }

    $params = $request->get_json_params();
    if ( ! is_array( $params ) ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_invalid_json', '送信内容を確認してください。' );
    }

    $allowed_fields = array( 'name', 'email', 'phone', 'message', 'website' );
    if ( array_diff( array_keys( $params ), $allowed_fields ) ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_unexpected_fields', '送信内容を確認してください。' );
    }

    foreach ( $allowed_fields as $field ) {
        if ( isset( $params[ $field ] ) && ! is_string( $params[ $field ] ) ) {
            return alohaalpha_contact_validation_error( 'alohaalpha_contact_invalid_field', '送信内容を確認してください。' );
        }
    }

    $website = isset( $params['website'] ) ? sanitize_text_field( $params['website'] ) : '';
    if ( '' !== $website ) {
        return rest_ensure_response(
            array(
                'success' => true,
                'message' => 'お問い合わせを受け付けました。ありがとうございます。',
            )
        );
    }

    $rate_limit = alohaalpha_contact_apply_rate_limit();
    if ( is_wp_error( $rate_limit ) ) {
        return $rate_limit;
    }

    $raw_name    = isset( $params['name'] ) ? trim( $params['name'] ) : '';
    $raw_email   = isset( $params['email'] ) ? trim( $params['email'] ) : '';
    $raw_phone   = isset( $params['phone'] ) ? trim( $params['phone'] ) : '';
    $raw_message = isset( $params['message'] ) ? trim( $params['message'] ) : '';

    if ( '' === $raw_name ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_name_required', 'お名前を入力してください。' );
    }

    if ( alohaalpha_contact_length( $raw_name ) > 100 ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_name_too_long', 'お名前が長すぎます。' );
    }

    if ( alohaalpha_contact_length( $raw_email ) > 254 || ! is_email( $raw_email ) ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_email_invalid', '有効なメールアドレスを入力してください。' );
    }

    if ( alohaalpha_contact_length( $raw_phone ) > 50 ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_phone_too_long', '電話番号が長すぎます。' );
    }

    if ( '' === $raw_message ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_message_required', 'お問い合わせ内容を入力してください。' );
    }

    if ( alohaalpha_contact_length( $raw_message ) > 1000 ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_message_too_long', '1000文字以内で入力してください。' );
    }

    if ( preg_match( '/[\r\n]/', $raw_name . $raw_email . $raw_phone ) ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_header_injection', '送信内容を確認してください。' );
    }

    $name    = sanitize_text_field( $raw_name );
    $email   = sanitize_email( $raw_email );
    $phone   = sanitize_text_field( $raw_phone );
    $message = sanitize_textarea_field( $raw_message );

    if ( '' === $name || ! is_email( $email ) || '' === $message ) {
        return alohaalpha_contact_validation_error( 'alohaalpha_contact_invalid', '送信内容を確認してください。' );
    }

    $body_lines = array(
        'お名前: ' . $name,
        'メールアドレス: ' . $email,
        '電話番号: ' . ( '' !== $phone ? $phone : '未入力' ),
        '',
        'お問い合わせ内容:',
        $message,
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        sprintf( 'Reply-To: %s <%s>', $name, $email ),
    );

    $accepted = wp_mail(
        ALOHAALPHA_CONTACT_RECIPIENT,
        '【Aloha Academy】新しいお問い合わせ',
        implode( "\n", $body_lines ),
        $headers
    );

    if ( ! $accepted ) {
        return new WP_Error(
            'alohaalpha_contact_send_failed',
            '送信できませんでした。時間をおいてもう一度お試しください。',
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response(
        array(
            'success' => true,
            'message' => 'お問い合わせを受け付けました。ありがとうございます。',
        )
    );
}

add_action( 'rest_api_init', function () {
    register_rest_route(
        'aloha/v1',
        '/contact',
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => 'alohaalpha_handle_contact_request',
            'permission_callback' => '__return_true',
        )
    );
} );
