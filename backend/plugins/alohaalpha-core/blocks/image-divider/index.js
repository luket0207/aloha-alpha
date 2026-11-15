(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType } = blocks;
    const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
    const { Button, PanelBody, Placeholder, RangeControl, TextControl } = components;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;

    const legacyAttributes = {
        imageId: { type: 'integer' },
        imageUrl: { type: 'string', default: '' },
        imageAlt: { type: 'string', default: '' },
        imageWidth: { type: 'integer' },
        imageHeight: { type: 'integer' },
        imageSrcSet: { type: 'string', default: '' },
        imageSizes: { type: 'string', default: '100vw' },
    };
    const attributes = {
        ...legacyAttributes,
        dividerHeight: { type: 'integer', default: 50 },
    };

    function normalizeDividerHeight(dividerHeight) {
        const numericHeight = Number(dividerHeight);
        if (!Number.isFinite(numericHeight)) return 50;
        return Math.min(100, Math.max(20, Math.round(numericHeight / 5) * 5));
    }

    function responsiveSourceSet(image) {
        const sources = Object.values(image.sizes || {})
            .filter((size) => size && size.url && size.width)
            .sort((left, right) => left.width - right.width)
            .map((size) => `${size.url} ${size.width}w`);

        return Array.from(new Set(sources)).join(', ');
    }

    function selectedImageAttributes(image) {
        return {
            imageId: image.id,
            imageUrl: image.url || '',
            imageAlt: image.alt || '',
            imageWidth: image.width || undefined,
            imageHeight: image.height || undefined,
            imageSrcSet: responsiveSourceSet(image),
        };
    }

    function imageElement(attributesValue) {
        if (!attributesValue.imageUrl) return null;

        return el('img', {
            alt: attributesValue.imageAlt,
            className: 'aloha-image-divider__image',
            height: attributesValue.imageHeight || undefined,
            sizes: attributesValue.imageSrcSet ? attributesValue.imageSizes : undefined,
            src: attributesValue.imageUrl,
            srcSet: attributesValue.imageSrcSet || undefined,
            width: attributesValue.imageWidth || undefined,
        });
    }

    registerBlockType('aloha/image-divider', {
        apiVersion: 3,
        title: __('Image Divider', 'alohaalpha-core'),
        description: __('Media Library image used as a full-width divider between page sections.', 'alohaalpha-core'),
        category: 'media',
        icon: 'format-image',
        attributes,
        supports: { align: ['wide', 'full'], html: false, reusable: true },
        edit: function Edit({ attributes: attributesValue, setAttributes }) {
            const dividerHeight = normalizeDividerHeight(attributesValue.dividerHeight);
            const blockProps = useBlockProps({
                className: 'aloha-image-divider',
                'data-divider-height': dividerHeight,
                style: { height: `${dividerHeight}vh` },
            });
            const mediaButton = (label, variant) => el(
                MediaUploadCheck,
                null,
                el(MediaUpload, {
                    allowedTypes: ['image'],
                    onSelect: (image) => setAttributes(selectedImageAttributes(image)),
                    render: ({ open }) => el(Button, { onClick: open, variant }, label),
                    value: attributesValue.imageId,
                })
            );

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: __('Image divider settings', 'alohaalpha-core') },
                        el(RangeControl, {
                            help: sprintf(
                                __('%d%% of the viewport height (%dvh)', 'alohaalpha-core'),
                                dividerHeight,
                                dividerHeight
                            ),
                            label: __('Divider Height', 'alohaalpha-core'),
                            max: 100,
                            min: 20,
                            onChange: (value) => setAttributes({ dividerHeight: normalizeDividerHeight(value) }),
                            step: 5,
                            value: dividerHeight,
                        }),
                        attributesValue.imageUrl
                            ? el(TextControl, {
                                help: __('Describe the image for visitors who cannot see it. Leave empty only when decorative.', 'alohaalpha-core'),
                                label: __('Alt text', 'alohaalpha-core'),
                                onChange: (imageAlt) => setAttributes({ imageAlt }),
                                value: attributesValue.imageAlt,
                            })
                            : null
                    )
                ),
                el(
                    'figure',
                    blockProps,
                    attributesValue.imageUrl
                        ? el(
                            Fragment,
                            null,
                            imageElement(attributesValue),
                            el(
                                'div',
                                { className: 'aloha-image-divider__controls' },
                                mediaButton(__('Replace image', 'alohaalpha-core'), 'secondary'),
                                el(
                                    Button,
                                    {
                                        isDestructive: true,
                                        onClick: () => setAttributes({
                                            imageId: undefined,
                                            imageUrl: '',
                                            imageAlt: '',
                                            imageWidth: undefined,
                                            imageHeight: undefined,
                                            imageSrcSet: '',
                                        }),
                                        variant: 'tertiary',
                                    },
                                    __('Remove image', 'alohaalpha-core')
                                )
                            )
                        )
                        : el(
                            Placeholder,
                            {
                                icon: 'format-image',
                                label: __('Image Divider', 'alohaalpha-core'),
                                instructions: __('Select an image from the Media Library.', 'alohaalpha-core'),
                            },
                            mediaButton(__('Select image', 'alohaalpha-core'), 'primary')
                        )
                )
            );
        },
        save: function Save({ attributes: attributesValue }) {
            const dividerHeight = normalizeDividerHeight(attributesValue.dividerHeight);
            const blockProps = useBlockProps.save({
                className: 'aloha-image-divider',
                'data-divider-height': dividerHeight,
                style: { height: `${dividerHeight}vh` },
            });
            return el('figure', blockProps, imageElement(attributesValue));
        },
        deprecated: [{
            attributes: legacyAttributes,
            save: function LegacySave({ attributes: attributesValue }) {
                const blockProps = useBlockProps.save({ className: 'aloha-image-divider' });
                return el('figure', blockProps, imageElement(attributesValue));
            },
        }],
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
