(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType } = blocks;
    const {
        InspectorControls,
        MediaUpload,
        MediaUploadCheck,
        RichText,
        useBlockProps,
    } = blockEditor;
    const { Button, PanelBody, Placeholder, TextControl } = components;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;

    function createItemId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function normalizeTestimonial(item) {
        return {
            id: typeof item.id === 'string' && item.id ? item.id : createItemId(),
            name: typeof item.name === 'string' ? item.name : '',
            quote: typeof item.quote === 'string' ? item.quote : '',
        };
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
            imageAlt: image.alt || '',
            imageHeight: image.height || undefined,
            imageId: image.id,
            imageSrcSet: responsiveSourceSet(image),
            imageUrl: image.url || '',
            imageWidth: image.width || undefined,
        };
    }

    function backgroundImage(attributes) {
        if (!attributes.imageUrl) return null;

        return el('img', {
            alt: attributes.imageAlt,
            className: 'aloha-testimonials__background-image',
            height: attributes.imageHeight || undefined,
            loading: 'lazy',
            sizes: attributes.imageSrcSet ? attributes.imageSizes : undefined,
            src: attributes.imageUrl,
            srcSet: attributes.imageSrcSet || undefined,
            width: attributes.imageWidth || undefined,
        });
    }

    function savedTestimonial(item, index) {
        return el(
            'article',
            {
                className: 'aloha-testimonials__card',
                'data-testimonial-id': item.id,
                key: item.id || index,
            },
            el(
                'blockquote',
                { className: 'aloha-testimonials__quote' },
                el(RichText.Content, { tagName: 'p', value: item.quote })
            ),
            el(RichText.Content, {
                className: 'aloha-testimonials__name',
                tagName: 'p',
                value: item.name,
            })
        );
    }

    registerBlockType('aloha/testimonials', {
        apiVersion: 3,
        title: __('Testimonials', 'alohaalpha-core'),
        description: __('Media Library background with an editable ordered collection of testimonials.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'format-quote',
        attributes: {
            imageId: { type: 'integer' },
            imageUrl: { type: 'string', default: '' },
            imageAlt: { type: 'string', default: '' },
            imageWidth: { type: 'integer' },
            imageHeight: { type: 'integer' },
            imageSrcSet: { type: 'string', default: '' },
            imageSizes: { type: 'string', default: '100vw' },
            testimonials: { type: 'array', default: [], items: { type: 'object' } },
        },
        supports: { align: ['wide', 'full'], anchor: true, html: false, reusable: true },
        edit: function Edit({ attributes, setAttributes }) {
            const testimonials = (attributes.testimonials || []).map(normalizeTestimonial);
            const blockProps = useBlockProps({ className: 'aloha-testimonials aloha-testimonials-editor' });

            function commit(nextTestimonials) {
                setAttributes({ testimonials: nextTestimonials.map(normalizeTestimonial) });
            }

            function update(index, changes) {
                commit(testimonials.map((item, itemIndex) => (
                    itemIndex === index ? { ...item, ...changes } : item
                )));
            }

            function move(index, offset) {
                const destination = index + offset;
                if (destination < 0 || destination >= testimonials.length) return;
                const nextTestimonials = [...testimonials];
                const [item] = nextTestimonials.splice(index, 1);
                nextTestimonials.splice(destination, 0, item);
                commit(nextTestimonials);
            }

            function addTestimonial() {
                commit([...testimonials, normalizeTestimonial({ id: createItemId() })]);
            }

            const mediaButton = (label, variant) => el(
                MediaUploadCheck,
                null,
                el(MediaUpload, {
                    allowedTypes: ['image'],
                    onSelect: (image) => setAttributes(selectedImageAttributes(image)),
                    render: ({ open }) => el(Button, { onClick: open, variant }, label),
                    value: attributes.imageId,
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
                        { title: __('Background image', 'alohaalpha-core') },
                        attributes.imageUrl
                            ? el(
                                Fragment,
                                null,
                                mediaButton(__('Replace image', 'alohaalpha-core'), 'secondary'),
                                el(Button, {
                                    isDestructive: true,
                                    onClick: () => setAttributes({
                                        imageAlt: '',
                                        imageHeight: undefined,
                                        imageId: undefined,
                                        imageSrcSet: '',
                                        imageUrl: '',
                                        imageWidth: undefined,
                                    }),
                                    variant: 'tertiary',
                                }, __('Remove image', 'alohaalpha-core')),
                                el(TextControl, {
                                    help: __('Leave empty only when the image is decorative.', 'alohaalpha-core'),
                                    label: __('Alt text', 'alohaalpha-core'),
                                    onChange: (imageAlt) => setAttributes({ imageAlt }),
                                    value: attributes.imageAlt,
                                })
                            )
                            : mediaButton(__('Select background image', 'alohaalpha-core'), 'primary')
                    )
                ),
                el(
                    'section',
                    blockProps,
                    el(
                        'div',
                        { className: 'aloha-testimonials-editor__background' },
                        backgroundImage(attributes) || el(
                            Placeholder,
                            {
                                icon: 'format-image',
                                instructions: __('Choose the full-width background image for this section.', 'alohaalpha-core'),
                                label: __('Testimonials background', 'alohaalpha-core'),
                            },
                            mediaButton(__('Select image', 'alohaalpha-core'), 'primary')
                        )
                    ),
                    el(
                        'div',
                        { className: 'aloha-testimonials-editor__header' },
                        el('strong', null, __('Testimonial entries', 'alohaalpha-core')),
                        el(Button, { onClick: addTestimonial, variant: 'primary' }, __('Add testimonial', 'alohaalpha-core'))
                    ),
                    testimonials.length
                        ? el(
                            'ol',
                            { className: 'aloha-testimonials-editor__list' },
                            ...testimonials.map((item, index) => el(
                                'li',
                                { className: 'aloha-testimonials-editor__item', key: item.id },
                                el('span', { className: 'aloha-testimonials-editor__number' }, sprintf(__('Testimonial %d', 'alohaalpha-core'), index + 1)),
                                el(RichText, {
                                    allowedFormats: ['core/bold', 'core/italic'],
                                    className: 'aloha-testimonials-editor__quote',
                                    onChange: (quote) => update(index, { quote }),
                                    placeholder: __('Enter the testimonial quote…', 'alohaalpha-core'),
                                    tagName: 'p',
                                    value: item.quote,
                                }),
                                el(RichText, {
                                    allowedFormats: [],
                                    className: 'aloha-testimonials-editor__name',
                                    onChange: (name) => update(index, { name }),
                                    placeholder: __('Enter the person’s name…', 'alohaalpha-core'),
                                    tagName: 'p',
                                    value: item.name,
                                }),
                                el(
                                    'div',
                                    { className: 'aloha-testimonials-editor__actions' },
                                    el(Button, {
                                        disabled: index === 0,
                                        onClick: () => move(index, -1),
                                        variant: 'secondary',
                                    }, __('Move up', 'alohaalpha-core')),
                                    el(Button, {
                                        disabled: index === testimonials.length - 1,
                                        onClick: () => move(index, 1),
                                        variant: 'secondary',
                                    }, __('Move down', 'alohaalpha-core')),
                                    el(Button, {
                                        isDestructive: true,
                                        onClick: () => commit(testimonials.filter((candidate) => candidate.id !== item.id)),
                                        variant: 'tertiary',
                                    }, __('Remove', 'alohaalpha-core'))
                                )
                            ))
                        )
                        : el(
                            Placeholder,
                            {
                                icon: 'format-quote',
                                instructions: __('Add quotes and names in the order they should appear.', 'alohaalpha-core'),
                                label: __('No testimonials yet', 'alohaalpha-core'),
                            },
                            el(Button, { onClick: addTestimonial, variant: 'primary' }, __('Add first testimonial', 'alohaalpha-core'))
                        )
                )
            );
        },
        save: function Save({ attributes }) {
            const testimonials = (attributes.testimonials || []).map(normalizeTestimonial);
            const blockProps = useBlockProps.save({
                className: 'aloha-testimonials',
                'data-testimonials-version': '1',
            });

            return el(
                'section',
                blockProps,
                el('div', { className: 'aloha-testimonials__background' }, backgroundImage(attributes)),
                el(
                    'div',
                    { className: 'aloha-testimonials__track' },
                    ...testimonials.map(savedTestimonial)
                )
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
