(function (blockEditor, blocks, components, compose, element, hooks, i18n) {
    const ATTRIBUTE_NAME = 'alohaHeaderColour';
    const DEFAULT_COLOUR = 'dark-green';
    const SUPPORTED_COLOURS = ['dark-green', 'green', 'dark-blue'];
    const { InspectorControls } = blockEditor;
    const { PanelBody, SelectControl } = components;
    const { createHigherOrderComponent } = compose;
    const { createElement: el, Fragment } = element;
    const { addFilter } = hooks;
    const { __ } = i18n;

    function hasClass(className, expectedClass) {
        return (` ${className || ''} `).includes(` ${expectedClass} `);
    }

    function normalizeHeaderColour(value) {
        return SUPPORTED_COLOURS.includes(value) ? value : DEFAULT_COLOUR;
    }

    addFilter(
        'blocks.registerBlockType',
        'alohaalpha/header-colour-attribute',
        function (settings, name) {
            if (name !== 'core/group') return settings;

            return {
                ...settings,
                attributes: {
                    ...settings.attributes,
                    [ATTRIBUTE_NAME]: {
                        type: 'string',
                        default: DEFAULT_COLOUR,
                    },
                },
            };
        }
    );

    const withHeaderColourControl = createHigherOrderComponent(function (BlockEdit) {
        return function HeaderColourControl(props) {
            const { attributes, isSelected, name, setAttributes } = props;
            const isHeader = name === 'core/group' && hasClass(attributes.className, 'aloha-header');

            if (!isHeader) return el(BlockEdit, props);

            return el(
                Fragment,
                null,
                el(BlockEdit, props),
                isSelected && el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        {
                            title: __('Header Colour', 'alohaalpha-core'),
                            initialOpen: true,
                        },
                        el(SelectControl, {
                            label: __('Header Colour', 'alohaalpha-core'),
                            value: normalizeHeaderColour(attributes[ATTRIBUTE_NAME]),
                            options: [
                                { label: __('Dark Green', 'alohaalpha-core'), value: 'dark-green' },
                                { label: __('Green', 'alohaalpha-core'), value: 'green' },
                                { label: __('Dark Blue', 'alohaalpha-core'), value: 'dark-blue' },
                            ],
                            onChange: function (value) {
                                setAttributes({ [ATTRIBUTE_NAME]: normalizeHeaderColour(value) });
                            },
                            help: __('Choose the colour used by the public navigation Header.', 'alohaalpha-core'),
                        })
                    )
                )
            );
        };
    }, 'withHeaderColourControl');

    addFilter(
        'editor.BlockEdit',
        'alohaalpha/header-colour-control',
        withHeaderColourControl
    );
})(
    window.wp.blockEditor,
    window.wp.blocks,
    window.wp.components,
    window.wp.compose,
    window.wp.element,
    window.wp.hooks,
    window.wp.i18n
);
