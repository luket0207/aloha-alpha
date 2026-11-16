(function (blocks, blockEditor, components, data, element, i18n) {
    const { registerBlockType } = blocks;
    const { InnerBlocks, InspectorControls, RichText, useBlockProps } = blockEditor;
    const { PanelBody, RangeControl, SelectControl, ToggleControl } = components;
    const { useDispatch, useSelect } = data;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;

    const legacyAttributes = {
        layout: { type: 'string', default: 'image-left', enum: ['image-left', 'image-right'] },
        colorScheme: { type: 'string', default: 'cream', enum: ['green', 'light-blue', 'cream'] },
        showTitle: { type: 'boolean', default: false },
        title: { type: 'string', default: '' },
        titleStyle: { type: 'string', default: 'japanese', enum: ['japanese', 'latin'] },
    };
    const attributes = {
        ...legacyAttributes,
        topWave: { type: 'boolean', default: false },
        bottomWave: { type: 'boolean', default: false },
        imageWidth: { type: 'integer', default: 40 },
    };
    const ALLOWED_BLOCKS = ['aloha/text-image-media', 'aloha/text-image-content'];
    const TEMPLATE = [
        ['aloha/text-image-media'],
        ['aloha/text-image-content'],
    ];

    function normalizeColorScheme(colorScheme) {
        return ['green', 'light-blue', 'cream'].includes(colorScheme) ? colorScheme : 'cream';
    }

    function normalizeLayout(layout) {
        return layout === 'image-right' ? 'image-right' : 'image-left';
    }

    function normalizeTitleStyle(titleStyle) {
        return titleStyle === 'latin' ? 'latin' : 'japanese';
    }

    function normalizeFrameType(frameType) {
        return frameType === 'square' ? 'square' : 'round';
    }

    function normalizeImageWidth(imageWidth) {
        const numericWidth = Number(imageWidth);
        if (!Number.isFinite(numericWidth)) return 40;
        return Math.min(80, Math.max(20, Math.round(numericWidth / 5) * 5));
    }

    function findNestedImageFrame(blocksValue) {
        for (const block of blocksValue || []) {
            if (block.name === 'aloha/image-frame') return block;
            const nestedFrame = findNestedImageFrame(block.innerBlocks);
            if (nestedFrame) return nestedFrame;
        }
        return null;
    }

    function blockClassName(attributesValue) {
        const colorScheme = normalizeColorScheme(attributesValue.colorScheme);
        const layout = normalizeLayout(attributesValue.layout);
        const topWaveClass = attributesValue.topWave ? ' has-top-wave' : '';
        const bottomWaveClass = attributesValue.bottomWave ? ' has-bottom-wave' : '';
        return `aloha-text-image aloha-text-image--${layout} aloha-text-image--${colorScheme} theme-${colorScheme}${topWaveClass}${bottomWaveClass}`;
    }

    function columnStyles(imageWidth) {
        return {
            '--aloha-side-image-column': `${imageWidth}fr`,
            '--aloha-side-text-column': `${100 - imageWidth}fr`,
        };
    }

    function titleElement(attributesValue, setAttributes) {
        if (!attributesValue.showTitle) return null;
        const titleStyle = normalizeTitleStyle(attributesValue.titleStyle);
        const props = {
            className: `aloha-text-image__title aloha-heading--${titleStyle}`,
            tagName: 'h2',
            value: attributesValue.title,
        };

        if (setAttributes) {
            props.onChange = (title) => setAttributes({ title });
            props.placeholder = __('Optional section title…', 'alohaalpha-core');
            return el(RichText, props);
        }

        return el(RichText.Content, props);
    }

    registerBlockType('aloha/text-image-side-by-side', {
        apiVersion: 3,
        title: __('Text Image — Side by Side', 'alohaalpha-core'),
        description: __('Selectable image-left or image-right layout with protected media and flexible text columns.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'align-pull-left',
        attributes,
        supports: { html: false, reusable: true },
        edit: function Edit({ attributes: attributesValue, clientId, setAttributes }) {
            const layout = normalizeLayout(attributesValue.layout);
            const colorScheme = normalizeColorScheme(attributesValue.colorScheme);
            const titleStyle = normalizeTitleStyle(attributesValue.titleStyle);
            const imageWidth = normalizeImageWidth(attributesValue.imageWidth);
            const imageFrame = useSelect(
                (select) => findNestedImageFrame(select('core/block-editor').getBlocks(clientId)),
                [clientId]
            );
            const { updateBlockAttributes } = useDispatch('core/block-editor');
            const frameType = normalizeFrameType(imageFrame && imageFrame.attributes.frameType);
            const blockProps = useBlockProps({
                className: blockClassName(attributesValue),
                'data-bottom-wave': attributesValue.bottomWave ? 'true' : 'false',
                'data-color-scheme': colorScheme,
                'data-image-width': imageWidth,
                'data-layout': layout,
                'data-top-wave': attributesValue.topWave ? 'true' : 'false',
            });

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: __('Section settings', 'alohaalpha-core') },
                        el(SelectControl, {
                            label: __('Desktop layout', 'alohaalpha-core'),
                            onChange: (value) => setAttributes({ layout: normalizeLayout(value) }),
                            options: [
                                { label: __('Image Left — Text Right', 'alohaalpha-core'), value: 'image-left' },
                                { label: __('Text Left — Image Right', 'alohaalpha-core'), value: 'image-right' },
                            ],
                            value: layout,
                        }),
                        el(SelectControl, {
                            label: __('Colour scheme', 'alohaalpha-core'),
                            onChange: (value) => setAttributes({ colorScheme: normalizeColorScheme(value) }),
                            options: [
                                { label: __('Green Group', 'alohaalpha-core'), value: 'green' },
                                { label: __('Light Blue Group', 'alohaalpha-core'), value: 'light-blue' },
                                { label: __('Cream Group', 'alohaalpha-core'), value: 'cream' },
                            ],
                            value: colorScheme,
                        }),
                        el(ToggleControl, {
                            checked: Boolean(attributesValue.topWave),
                            label: __('Top Wave', 'alohaalpha-core'),
                            onChange: (topWave) => setAttributes({ topWave }),
                        }),
                        el(ToggleControl, {
                            checked: Boolean(attributesValue.bottomWave),
                            label: __('Bottom Wave', 'alohaalpha-core'),
                            onChange: (bottomWave) => setAttributes({ bottomWave }),
                        }),
                        el(SelectControl, {
                            disabled: !imageFrame,
                            help: imageFrame
                                ? __('This updates the nested Image Frame block.', 'alohaalpha-core')
                                : __('The protected Image Frame is being prepared.', 'alohaalpha-core'),
                            label: __('Image Frame Type', 'alohaalpha-core'),
                            onChange: (value) => {
                                if (imageFrame) {
                                    updateBlockAttributes(imageFrame.clientId, {
                                        frameType: normalizeFrameType(value),
                                    });
                                }
                            },
                            options: [
                                { label: __('Round Frame', 'alohaalpha-core'), value: 'round' },
                                { label: __('Square Frame', 'alohaalpha-core'), value: 'square' },
                            ],
                            value: frameType,
                        }),
                        el(RangeControl, {
                            help: sprintf(
                                __('Image %1$d%% / Text %2$d%%', 'alohaalpha-core'),
                                imageWidth,
                                100 - imageWidth
                            ),
                            label: __('Image Width', 'alohaalpha-core'),
                            max: 80,
                            min: 20,
                            onChange: (value) => setAttributes({ imageWidth: normalizeImageWidth(value) }),
                            step: 5,
                            value: imageWidth,
                        }),
                        el(ToggleControl, {
                            checked: Boolean(attributesValue.showTitle),
                            label: __('Show centred H2 title', 'alohaalpha-core'),
                            onChange: (showTitle) => setAttributes({ showTitle }),
                        }),
                        attributesValue.showTitle
                            ? el(SelectControl, {
                                label: __('Title typography', 'alohaalpha-core'),
                                onChange: (value) => setAttributes({ titleStyle: normalizeTitleStyle(value) }),
                                options: [
                                    { label: __('Japanese heading', 'alohaalpha-core'), value: 'japanese' },
                                    { label: __('Latin heading', 'alohaalpha-core'), value: 'latin' },
                                ],
                                value: titleStyle,
                            })
                            : null
                    )
                ),
                el(
                    'section',
                    blockProps,
                    titleElement(attributesValue, setAttributes),
                    el(
                        'div',
                        { className: 'aloha-text-image__columns', style: columnStyles(imageWidth) },
                        el(InnerBlocks, {
                            allowedBlocks: ALLOWED_BLOCKS,
                            renderAppender: false,
                            template: TEMPLATE,
                            templateLock: 'all',
                        })
                    )
                )
            );
        },
        save: function Save({ attributes: attributesValue }) {
            const layout = normalizeLayout(attributesValue.layout);
            const colorScheme = normalizeColorScheme(attributesValue.colorScheme);
            const imageWidth = normalizeImageWidth(attributesValue.imageWidth);
            const blockProps = useBlockProps.save({
                className: blockClassName(attributesValue),
                'data-bottom-wave': attributesValue.bottomWave ? 'true' : 'false',
                'data-color-scheme': colorScheme,
                'data-image-width': imageWidth,
                'data-layout': layout,
                'data-top-wave': attributesValue.topWave ? 'true' : 'false',
            });

            return el(
                'section',
                blockProps,
                titleElement(attributesValue),
                el(
                    'div',
                    { className: 'aloha-text-image__columns', style: columnStyles(imageWidth) },
                    el(InnerBlocks.Content)
                )
            );
        },
        deprecated: [{
            attributes: legacyAttributes,
            save: function LegacySave({ attributes: attributesValue }) {
                const layout = normalizeLayout(attributesValue.layout);
                const colorScheme = normalizeColorScheme(attributesValue.colorScheme);
                const blockProps = useBlockProps.save({
                    className: blockClassName(attributesValue),
                    'data-color-scheme': colorScheme,
                    'data-layout': layout,
                });

                return el(
                    'section',
                    blockProps,
                    titleElement(attributesValue),
                    el('div', { className: 'aloha-text-image__columns' }, el(InnerBlocks.Content))
                );
            },
        }],
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.data,
    window.wp.element,
    window.wp.i18n
);
