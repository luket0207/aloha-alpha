(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType } = blocks;
    const { useBlockProps } = blockEditor;
    const { Button, Notice, TextareaControl } = components;
    const { createElement: el, Fragment, useEffect, useState } = element;
    const { __ } = i18n;

    const MAP_DESTINATION = 'https://www.google.com/maps/place/%E3%80%92205-0001+Tokyo,+Hamura,+Ozakudai,+3-ch%C5%8Dme%E2%88%92%EF%BC%92%EF%BC%91%E2%88%922/@35.7757325,139.3004726,17z/';
    const MAP_TITLE = __('Google Map showing Aloha Academy in Hamura, Tokyo', 'alohaalpha-core');

    function extractSource(value) {
        const input = String(value || '').trim();
        if (!input) return '';
        if (!input.includes('<')) return input;

        const parsed = new DOMParser().parseFromString(input, 'text/html');
        return parsed.querySelector('iframe')?.getAttribute('src') || '';
    }

    function validateEmbedUrl(value) {
        const source = extractSource(value);
        if (!source) return '';

        try {
            const url = new URL(source);
            const googleHost = url.hostname === 'google.com' || url.hostname.endsWith('.google.com');
            const embedPath = url.pathname.startsWith('/maps/embed')
                || (url.pathname.startsWith('/maps') && url.searchParams.get('output') === 'embed');

            return url.protocol === 'https:' && googleHost && embedPath ? url.href : '';
        } catch (error) {
            return '';
        }
    }

    function mapFrame(embedUrl) {
        const validatedUrl = validateEmbedUrl(embedUrl);
        if (!validatedUrl) return null;

        return el('iframe', {
            allowFullScreen: true,
            className: 'aloha-access-map__iframe',
            loading: 'lazy',
            referrerPolicy: 'no-referrer-when-downgrade',
            src: validatedUrl,
            title: MAP_TITLE,
        });
    }

    function fallbackLink() {
        return el(
            'a',
            {
                className: 'aloha-access-map__external-link',
                href: MAP_DESTINATION,
                rel: 'noreferrer',
                target: '_blank',
            },
            __('Open the Aloha Academy location in Google Maps', 'alohaalpha-core')
        );
    }

    registerBlockType('aloha/access-map', {
        apiVersion: 3,
        title: __('Access Map', 'alohaalpha-core'),
        description: __('Validated Google Maps embed for the Aloha Academy location.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'location-alt',
        attributes: {
            embedUrl: { type: 'string', default: '' },
        },
        supports: { align: ['wide', 'full'], anchor: true, html: false, reusable: true },
        edit: function Edit({ attributes, setAttributes }) {
            const [input, setInput] = useState(attributes.embedUrl || '');
            const [error, setError] = useState('');
            const blockProps = useBlockProps({ className: 'aloha-access-map aloha-access-map-editor' });
            const validatedUrl = validateEmbedUrl(attributes.embedUrl);

            useEffect(() => {
                setInput(attributes.embedUrl || '');
            }, [attributes.embedUrl]);

            function applyEmbed() {
                const nextUrl = validateEmbedUrl(input);
                if (!nextUrl) {
                    setError(__('Paste an official HTTPS Google Maps embed URL or iframe.', 'alohaalpha-core'));
                    return;
                }

                setAttributes({ embedUrl: nextUrl });
                setInput(nextUrl);
                setError('');
            }

            return el(
                'section',
                blockProps,
                el('h2', { className: 'aloha-access-map__title aloha-heading--japanese' }, '\u30a2\u30af\u30bb\u30b9'),
                el(
                    'div',
                    { className: 'aloha-access-map-editor__controls' },
                    el(TextareaControl, {
                        help: __('Google Maps → Share → Embed a map → Copy HTML. Only the validated src URL is stored.', 'alohaalpha-core'),
                        label: __('Google Maps embed URL or iframe HTML', 'alohaalpha-core'),
                        onChange: (value) => {
                            setInput(value);
                            setError('');
                        },
                        rows: 4,
                        value: input,
                    }),
                    error
                        ? el(Notice, { isDismissible: false, status: 'error' }, error)
                        : null,
                    el(
                        'div',
                        { className: 'aloha-access-map-editor__actions' },
                        el(Button, { onClick: applyEmbed, variant: 'primary' }, __('Apply embed', 'alohaalpha-core')),
                        validatedUrl
                            ? el(Button, {
                                isDestructive: true,
                                onClick: () => {
                                    setAttributes({ embedUrl: '' });
                                    setInput('');
                                    setError('');
                                },
                                variant: 'tertiary',
                            }, __('Remove embed', 'alohaalpha-core'))
                            : null
                    )
                ),
                el(
                    'div',
                    { className: 'aloha-access-map__frame' },
                    mapFrame(validatedUrl) || el(
                        'p',
                        { className: 'aloha-access-map-editor__placeholder' },
                        __('The validated interactive map preview will appear here.', 'alohaalpha-core')
                    )
                ),
                fallbackLink()
            );
        },
        save: function Save({ attributes }) {
            const embedUrl = validateEmbedUrl(attributes.embedUrl);
            const blockProps = useBlockProps.save({
                className: 'aloha-access-map',
                'data-access-map-version': '1',
                'data-embed-url': embedUrl || undefined,
            });

            return el(
                'section',
                blockProps,
                el('h2', { className: 'aloha-access-map__title aloha-heading--japanese' }, '\u30a2\u30af\u30bb\u30b9'),
                el(
                    'div',
                    { className: 'aloha-access-map__frame' },
                    mapFrame(embedUrl) || el(
                        'p',
                        { className: 'aloha-access-map__fallback' },
                        __('The interactive map has not been configured yet.', 'alohaalpha-core')
                    )
                ),
                fallbackLink()
            );
        },
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
