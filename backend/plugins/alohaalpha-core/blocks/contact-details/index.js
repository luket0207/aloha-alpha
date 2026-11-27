(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType, registerBlockVariation } = blocks;
    const { useBlockProps } = blockEditor;
    const { Button, Flex, PanelBody, TextControl } = components;
    const { createElement: el } = element;
    const { __, sprintf } = i18n;
    const blockName = 'aloha/contact-details';

    const fields = [
        { key: 'companyName', label: __('Company name', 'alohaalpha-core') },
        { key: 'address', label: __('Postal address', 'alohaalpha-core') },
        { key: 'email', label: __('Email address', 'alohaalpha-core'), type: 'email' },
        { key: 'telephone', label: __('Telephone number', 'alohaalpha-core'), type: 'tel' },
    ];

    function createHour() {
        const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return { id, days: '', times: '' };
    }

    function HoursEntry({ entry, number, onChange, onRemove }) {
        return el(
            'fieldset',
            null,
            el('legend', null, sprintf(__('Hours entry %d', 'alohaalpha-core'), number)),
            el(
                Flex,
                { align: 'start', justify: 'start', wrap: true },
                el(TextControl, {
                    __nextHasNoMarginBottom: true,
                    __next40pxDefaultSize: true,
                    label: __('Day or day range', 'alohaalpha-core'),
                    onChange: (days) => onChange({ ...entry, days }),
                    value: entry.days,
                }),
                el(TextControl, {
                    __nextHasNoMarginBottom: true,
                    __next40pxDefaultSize: true,
                    label: __('Time range', 'alohaalpha-core'),
                    onChange: (times) => onChange({ ...entry, times }),
                    value: entry.times,
                })
            ),
            el(Button, { isDestructive: true, onClick: onRemove, variant: 'tertiary' }, __('Remove hours entry', 'alohaalpha-core'))
        );
    }

    registerBlockType(blockName, {
        edit: function Edit({ attributes, setAttributes }) {
            const blockProps = useBlockProps();
            const { openingHours } = attributes;
            return el(
                'div',
                blockProps,
                el(
                    PanelBody,
                    { title: __('Contact Details', 'alohaalpha-core'), initialOpen: true },
                    ...fields.map(({ key, label, type }) => el(TextControl, {
                        __next40pxDefaultSize: true,
                        key,
                        label,
                        onChange: (value) => setAttributes({ [key]: value }),
                        type,
                        value: attributes[key],
                    }))
                ),
                el(
                    PanelBody,
                    { title: __('Opening hours', 'alohaalpha-core'), initialOpen: true },
                    ...openingHours.map((entry, index) => el(HoursEntry, {
                        key: entry.id,
                        entry,
                        number: index + 1,
                        onChange: (updated) => setAttributes({
                            openingHours: openingHours.map((item) => item.id === updated.id ? updated : item),
                        }),
                        onRemove: () => setAttributes({
                            openingHours: openingHours.filter((item) => item.id !== entry.id),
                        }),
                    })),
                    el(Button, {
                        onClick: () => setAttributes({ openingHours: [...openingHours, createHour()] }),
                        variant: 'secondary',
                    }, __('Add hours entry', 'alohaalpha-core'))
                )
            );
        },
        save: () => null,
    });

    registerBlockVariation(blockName, {
        name: 'aloha-academy',
        title: __('Contact Details', 'alohaalpha-core'),
        isDefault: true,
        scope: ['inserter'],
        attributes: {
            companyName: '株式会社 Aloha Academy',
            address: '東京都羽村市小作台3丁目21-1,1階',
            email: 'info.englishschool.hawaii@gmail.com',
            telephone: '080-5360-7747',
            openingHours: [
                { id: 'weekdays', days: '火曜日-金曜日', times: '15:00-19:00' },
                { id: 'saturday', days: '土曜日', times: '9:30-16:30' },
            ],
        },
    });
})(window.wp.blocks, window.wp.blockEditor, window.wp.components, window.wp.element, window.wp.i18n);
