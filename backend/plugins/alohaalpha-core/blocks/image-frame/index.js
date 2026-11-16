(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType, registerBlockVariation } = blocks;
    const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
    const { Button, PanelBody, Placeholder, SelectControl, TextControl } = components;
    const { createElement: el, Fragment } = element;
    const { __ } = i18n;

    const attributes = {
        frameType: { type: 'string', default: 'round', enum: ['round', 'square'] },
        imageId: { type: 'integer' },
        imageUrl: { type: 'string', default: '' },
        imageAlt: { type: 'string', default: '' },
        imageWidth: { type: 'integer' },
        imageHeight: { type: 'integer' },
        imageSrcSet: { type: 'string', default: '' },
        imageSizes: { type: 'string', default: '(max-width: 767px) 100vw, 40vw' },
    };

    function normalizeFrameType(frameType) {
        return frameType === 'square' ? 'square' : 'round';
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
            className: 'aloha-image-frame__image',
            height: attributesValue.imageHeight || undefined,
            sizes: attributesValue.imageSrcSet ? attributesValue.imageSizes : undefined,
            src: attributesValue.imageUrl,
            srcSet: attributesValue.imageSrcSet || undefined,
            width: attributesValue.imageWidth || undefined,
        });
    }

    registerBlockType('aloha/image-frame', {
        apiVersion: 3,
        title: __('Image Frame', 'alohaalpha-core'),
        description: __('Media Library image with a selectable Aloha frame style.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'format-image',
        attributes,
        supports: { html: false, reusable: true },
        edit: function Edit({ attributes: attributesValue, setAttributes }) {
            const frameType = normalizeFrameType(attributesValue.frameType);
            const blockProps = useBlockProps({
                className: `aloha-image-frame aloha-image-frame--${frameType}`,
                'data-frame-type': frameType,
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
                        { title: __('Image frame settings', 'alohaalpha-core') },
                        el(SelectControl, {
                            label: __('Frame style', 'alohaalpha-core'),
                            onChange: (value) => setAttributes({ frameType: normalizeFrameType(value) }),
                            options: [
                                { label: __('Round Frame', 'alohaalpha-core'), value: 'round' },
                                { label: __('Square Frame', 'alohaalpha-core'), value: 'square' },
                            ],
                            value: frameType,
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
                                { className: 'aloha-image-frame__controls' },
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
                                label: frameType === 'round'
                                    ? __('Round Frame', 'alohaalpha-core')
                                    : __('Square Frame', 'alohaalpha-core'),
                                instructions: __('Select an image from the Media Library.', 'alohaalpha-core'),
                            },
                            mediaButton(__('Select image', 'alohaalpha-core'), 'primary')
                        )
                )
            );
        },
        save: function Save({ attributes: attributesValue }) {
            const frameType = normalizeFrameType(attributesValue.frameType);
            const blockProps = useBlockProps.save({
                className: `aloha-image-frame aloha-image-frame--${frameType}`,
                'data-frame-type': frameType,
            });

            return el('figure', blockProps, imageElement(attributesValue));
        },
    });

    registerBlockVariation('aloha/image-frame', {
        name: 'round',
        title: __('Round Frame', 'alohaalpha-core'),
        description: __('Mostly circular organic image frame.', 'alohaalpha-core'),
        attributes: { frameType: 'round' },
        scope: ['inserter', 'transform'],
        isDefault: true,
        isActive: ['frameType'],
    });

    registerBlockVariation('aloha/image-frame', {
        name: 'square',
        title: __('Square Frame', 'alohaalpha-core'),
        description: __('Responsive rectangular image frame with softly waved edges.', 'alohaalpha-core'),
        attributes: { frameType: 'square' },
        scope: ['inserter', 'transform'],
        isActive: ['frameType'],
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
