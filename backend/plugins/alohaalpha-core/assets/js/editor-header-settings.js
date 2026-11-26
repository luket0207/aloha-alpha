(function (blockEditor, components, compose, element, hooks, i18n) {
    const { InspectorControls } = blockEditor;
    const { PanelBody, SelectControl } = components;
    const { createHigherOrderComponent } = compose;
    const { createElement: el, Fragment } = element;
    const { addFilter } = hooks;
    const { __ } = i18n;

    const sectionSettings = [
        {
            className: 'aloha-header',
            attribute: 'alohaHeaderColour',
            title: __('Header Colour', 'alohaalpha-core'),
            defaultColour: 'dark-green',
            options: [
                { label: __('Dark Green', 'alohaalpha-core'), value: 'dark-green' },
                { label: __('Green', 'alohaalpha-core'), value: 'green' },
                { label: __('Dark Blue', 'alohaalpha-core'), value: 'dark-blue' },
            ],
            help: __('Choose the colour used by the public navigation Header.', 'alohaalpha-core'),
        },
        {
            className: 'aloha-footer',
            attribute: 'alohaFooterColour',
            title: __('Footer Colour', 'alohaalpha-core'),
            defaultColour: 'light-blue',
            options: [
                { label: __('Light Blue', 'alohaalpha-core'), value: 'light-blue' },
                { label: __('Dark Blue', 'alohaalpha-core'), value: 'dark-blue' },
                { label: __('Green', 'alohaalpha-core'), value: 'green' },
            ],
            help: __('Choose the colour used by the public Footer.', 'alohaalpha-core'),
        },
    ];

    function normalizeColour(value, { options, defaultColour }) {
        return options.some((option) => option.value === value) ? value : defaultColour;
    }

    addFilter(
        'blocks.registerBlockType',
        'alohaalpha/header-colour-attribute',
        function (settings, name) {
            if (name !== 'core/group') return settings;

            const attributes = { ...settings.attributes };
            sectionSettings.forEach(({ attribute, defaultColour }) => {
                attributes[attribute] = { type: 'string', default: defaultColour };
            });

            return {
                ...settings,
                attributes,
            };
        }
    );

    const withSectionColourControl = createHigherOrderComponent(function (BlockEdit) {
        return function SectionColourControl(props) {
            const { attributes, isSelected, name, setAttributes } = props;
            if (name !== 'core/group' || !isSelected) return el(BlockEdit, props);

            const classes = (attributes.className || '').split(/\s+/);
            const setting = sectionSettings.find(({ className }) => classes.includes(className));
            if (!setting) return el(BlockEdit, props);
            const { attribute, title, options, help } = setting;

            return el(
                Fragment,
                null,
                el(BlockEdit, props),
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        {
                            title,
                            initialOpen: true,
                        },
                        el(SelectControl, {
                            label: title,
                            value: normalizeColour(attributes[attribute], setting),
                            options,
                            onChange: function (value) {
                                setAttributes({ [attribute]: normalizeColour(value, setting) });
                            },
                            help,
                        })
                    )
                )
            );
        };
    }, 'withSectionColourControl');

    addFilter(
        'editor.BlockEdit',
        'alohaalpha/header-colour-control',
        withSectionColourControl
    );
})(
    window.wp.blockEditor,
    window.wp.components,
    window.wp.compose,
    window.wp.element,
    window.wp.hooks,
    window.wp.i18n
);
