(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType } = blocks;
    const { MediaUpload, MediaUploadCheck, RichText, useBlockProps } = blockEditor;
    const { Button } = components;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;
    const editorSettings = window.alohaalphaHomeHeroEditor || {};

    const attributes = {
        slogan: { type: 'string', default: 'Aloha starts here' },
        images: { type: 'array', default: [] },
    };

    function responsiveSourceSet(image) {
        const imageValue = image.attributes || image;
        const sources = Object.values(imageValue.sizes || {})
            .filter((size) => size && size.url && size.width)
            .sort((left, right) => left.width - right.width)
            .map((size) => `${size.url} ${size.width}w`);

        return Array.from(new Set(sources)).join(', ');
    }

    function normalizeImage(image) {
        const imageValue = image.attributes || image;
        return {
            id: Number(imageValue.id) || undefined,
            url: imageValue.url || imageValue.source_url || '',
            alt: imageValue.alt || imageValue.alt_text || '',
            width: Number(imageValue.width) || undefined,
            height: Number(imageValue.height) || undefined,
            srcSet: responsiveSourceSet(imageValue),
            sizes: '(max-width: 767px) 100vw, 68vw',
        };
    }

    function normalizedImages(images) {
        return Array.isArray(images) ? images.filter((image) => image && image.url) : [];
    }

    registerBlockType('aloha/home-hero', {
        apiVersion: 3,
        title: __('Home Hero', 'alohaalpha-core'),
        description: __('Homepage Hero with an editable slogan and ordered Media Library slideshow.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'slides',
        attributes,
        supports: { html: false, reusable: true },
        edit: function Edit({ attributes: attributesValue, setAttributes }) {
            const images = normalizedImages(attributesValue.images);
            const blockProps = useBlockProps({ className: 'aloha-home-hero-editor' });

            function setImages(nextImages) {
                setAttributes({ images: nextImages.map(normalizeImage).filter((image) => image.url) });
            }

            function replaceImage(index, image) {
                const nextImages = [...images];
                nextImages[index] = normalizeImage(image);
                setAttributes({ images: nextImages });
            }

            function removeImage(index) {
                setAttributes({ images: images.filter((image, imageIndex) => imageIndex !== index) });
            }

            function moveImage(index, direction) {
                const destination = index + direction;
                if (destination < 0 || destination >= images.length) return;
                const nextImages = [...images];
                [nextImages[index], nextImages[destination]] = [nextImages[destination], nextImages[index]];
                setAttributes({ images: nextImages });
            }

            const galleryControl = el(
                MediaUploadCheck,
                null,
                el(MediaUpload, {
                    addToGallery: true,
                    allowedTypes: ['image'],
                    gallery: true,
                    multiple: true,
                    onSelect: (selectedImages) => setImages(Array.isArray(selectedImages) ? selectedImages : []),
                    render: ({ open }) => el(
                        Button,
                        { onClick: open, variant: images.length ? 'secondary' : 'primary' },
                        images.length
                            ? __('Add or manage carousel images', 'alohaalpha-core')
                            : __('Select carousel images', 'alohaalpha-core')
                    ),
                    value: images.map((image) => image.id).filter(Boolean),
                })
            );

            return el(
                'section',
                blockProps,
                el(
                    'div',
                    { className: 'aloha-home-hero-editor__preview' },
                    el('div', {
                        className: 'aloha-home-hero-editor__logo',
                        dangerouslySetInnerHTML: { __html: editorSettings.logoHtml || '' },
                    }),
                    !editorSettings.logoHtml
                        ? el(
                            'p',
                            { className: 'aloha-home-hero-editor__logo-missing' },
                            __('The synced Large Logo preview is unavailable.', 'alohaalpha-core')
                        )
                        : null,
                    el(RichText, {
                        className: 'aloha-home-hero-editor__slogan aloha-heading--latin',
                        onChange: (slogan) => setAttributes({ slogan }),
                        placeholder: __('Hero sloganâ€¦', 'alohaalpha-core'),
                        tagName: 'h3',
                        value: attributesValue.slogan,
                    }),
                    images.length
                        ? el(
                            'ol',
                            { className: 'aloha-home-hero-editor__images' },
                            images.map((image, index) => el(
                                'li',
                                { className: 'aloha-home-hero-editor__image-item', key: `${image.id || image.url}-${index}` },
                                el(
                                    'figure',
                                    { className: 'aloha-home-hero-editor__image' },
                                    el('img', {
                                        alt: image.alt,
                                        height: image.height || undefined,
                                        src: image.url,
                                        width: image.width || undefined,
                                    }),
                                    el('figcaption', null, sprintf(__('Slide %d', 'alohaalpha-core'), index + 1))
                                ),
                                el(
                                    'div',
                                    { className: 'aloha-home-hero-editor__image-controls' },
                                    el(Button, {
                                        disabled: index === 0,
                                        label: sprintf(__('Move slide %d earlier', 'alohaalpha-core'), index + 1),
                                        onClick: () => moveImage(index, -1),
                                        size: 'small',
                                        variant: 'secondary',
                                    }, __('Move earlier', 'alohaalpha-core')),
                                    el(Button, {
                                        disabled: index === images.length - 1,
                                        label: sprintf(__('Move slide %d later', 'alohaalpha-core'), index + 1),
                                        onClick: () => moveImage(index, 1),
                                        size: 'small',
                                        variant: 'secondary',
                                    }, __('Move later', 'alohaalpha-core')),
                                    el(
                                        MediaUploadCheck,
                                        null,
                                        el(MediaUpload, {
                                            allowedTypes: ['image'],
                                            onSelect: (selectedImage) => replaceImage(index, selectedImage),
                                            render: ({ open }) => el(
                                                Button,
                                                {
                                                    label: sprintf(__('Replace slide %d', 'alohaalpha-core'), index + 1),
                                                    onClick: open,
                                                    size: 'small',
                                                    variant: 'secondary',
                                                },
                                                __('Replace', 'alohaalpha-core')
                                            ),
                                            value: image.id,
                                        })
                                    ),
                                    el(Button, {
                                        isDestructive: true,
                                        label: sprintf(__('Remove slide %d', 'alohaalpha-core'), index + 1),
                                        onClick: () => removeImage(index),
                                        size: 'small',
                                        variant: 'tertiary',
                                    }, __('Remove', 'alohaalpha-core'))
                                )
                            ))
                        )
                        : el(
                            'p',
                            { className: 'aloha-home-hero-editor__empty' },
                            __('No carousel images selected.', 'alohaalpha-core')
                        )
                ),
                el('div', { className: 'aloha-home-hero-editor__gallery-control' }, galleryControl)
            );
        },
        save: function Save() {
            return null;
        },
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
