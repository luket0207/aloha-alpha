(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType, registerBlockVariation } = blocks;
    const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
    const { Button, PanelBody, RadioControl } = components;
    const { createElement: el, Fragment } = element;
    const { __ } = i18n;

    const attributes = {
        variant: { type: 'string', default: 'small' },
        imageId: { type: 'integer' },
        imageUrl: { type: 'string', default: '' },
        imageAlt: { type: 'string', default: '' },
    };

    function normalizedVariant(variant) {
        return variant === 'large' ? 'large' : 'small';
    }

    function flower(attributesValue) {
        if (!attributesValue.imageUrl) return null;

        return el('img', {
            className: 'aloha-logo__flower',
            src: attributesValue.imageUrl,
            alt: '',
            'aria-hidden': 'true',
        });
    }

    function wordmark(variant) {
        if (variant === 'large') {
            return el(
                'span',
                { className: 'aloha-logo__wordmark' },
                el('span', { className: 'aloha-logo__line aloha-logo__line--aloha' }, 'Aloha'),
                el('span', { className: 'aloha-logo__line aloha-logo__line--academy' }, 'Academy')
            );
        }

        return el('span', { className: 'aloha-logo__wordmark' }, 'Aloha Academy');
    }

    function logoPreview(attributesValue, blockProps, includePlaceholder) {
        const variant = normalizedVariant(attributesValue.variant);
        const image = flower(attributesValue);

        return el(
            'div',
            blockProps,
            image || (includePlaceholder
                ? el('span', { className: 'aloha-logo__flower-placeholder', 'aria-hidden': 'true' }, __('Flower', 'alohaalpha-core'))
                : null),
            wordmark(variant)
        );
    }

    registerBlockType('aloha/logo', {
        apiVersion: 3,
        title: __('Aloha Logo', 'alohaalpha-core'),
        description: __('Reusable Aloha Academy wordmark with a Media Library flower image.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'format-image',
        attributes,
        supports: {
            html: false,
            reusable: true,
        },
        edit: function Edit({ attributes: attributesValue, setAttributes }) {
            const variant = normalizedVariant(attributesValue.variant);
            const blockProps = useBlockProps({
                className: `aloha-logo aloha-logo--${variant}`,
            });

            function selectImage(image) {
                setAttributes({
                    imageId: image.id,
                    imageUrl: image.url,
                    imageAlt: image.alt || '',
                });
            }

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: __('Logo settings', 'alohaalpha-core') },
                        el(RadioControl, {
                            label: __('Size', 'alohaalpha-core'),
                            selected: variant,
                            options: [
                                { label: __('Small', 'alohaalpha-core'), value: 'small' },
                                { label: __('Large', 'alohaalpha-core'), value: 'large' },
                            ],
                            onChange: (value) => setAttributes({ variant: value }),
                        })
                    )
                ),
                logoPreview(attributesValue, blockProps, true),
                el(
                    'div',
                    { className: 'aloha-logo__media-controls' },
                    el(
                        MediaUploadCheck,
                        null,
                        el(MediaUpload, {
                            allowedTypes: ['image'],
                            value: attributesValue.imageId,
                            onSelect: selectImage,
                            render: ({ open }) => el(
                                Button,
                                { variant: 'secondary', onClick: open },
                                attributesValue.imageUrl
                                    ? __('Replace flower image', 'alohaalpha-core')
                                    : __('Select flower image', 'alohaalpha-core')
                            ),
                        })
                    ),
                    attributesValue.imageUrl
                        ? el(
                            Button,
                            {
                                variant: 'tertiary',
                                isDestructive: true,
                                onClick: () => setAttributes({ imageId: undefined, imageUrl: '', imageAlt: '' }),
                            },
                            __('Remove image', 'alohaalpha-core')
                        )
                        : null
                )
            );
        },
        save: function Save({ attributes: attributesValue }) {
            const variant = normalizedVariant(attributesValue.variant);
            const blockProps = useBlockProps.save({
                className: `aloha-logo aloha-logo--${variant}`,
            });

            return logoPreview(attributesValue, blockProps, false);
        },
    });

    registerBlockVariation('aloha/logo', {
        name: 'small',
        title: __('Aloha Logo — Small', 'alohaalpha-core'),
        description: __('Horizontal Aloha Academy logo.', 'alohaalpha-core'),
        attributes: { variant: 'small' },
        scope: ['inserter', 'transform'],
        isDefault: true,
        isActive: ['variant'],
    });

    registerBlockVariation('aloha/logo', {
        name: 'large',
        title: __('Aloha Logo — Large', 'alohaalpha-core'),
        description: __('Two-line Aloha Academy logo.', 'alohaalpha-core'),
        attributes: { variant: 'large' },
        scope: ['inserter', 'transform'],
        isActive: ['variant'],
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
