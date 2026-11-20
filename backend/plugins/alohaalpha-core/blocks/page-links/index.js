(function (blocks, blockEditor, components, element, i18n) {
    const { registerBlockType } = blocks;
    const {
        __experimentalLinkControl: ExperimentalLinkControl,
        LinkControl: StableLinkControl,
        useBlockProps,
    } = blockEditor;
    const { Button, Placeholder, SelectControl, TextControl } = components;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;
    const LinkControl = StableLinkControl || ExperimentalLinkControl;

    const ICON_OPTIONS = [
        { dashicon: 'admin-home', label: __('Home', 'alohaalpha-core'), value: 'house' },
        { dashicon: 'welcome-learn-more', label: __('Classes', 'alohaalpha-core'), value: 'person-chalkboard' },
        { dashicon: 'camera', label: __('Gallery', 'alohaalpha-core'), value: 'camera' },
        { dashicon: 'calendar-alt', label: __('Booking', 'alohaalpha-core'), value: 'calendar-days' },
        { dashicon: 'editor-help', label: __('FAQs', 'alohaalpha-core'), value: 'question' },
        { dashicon: 'admin-users', label: __('Recruitment', 'alohaalpha-core'), value: 'person-circle-plus' },
    ];
    const ICON_VALUES = ICON_OPTIONS.map((option) => option.value);

    function createItemId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `page-link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function normalizeIcon(icon) {
        return ICON_VALUES.includes(icon) ? icon : ICON_OPTIONS[0].value;
    }

    function normalizeLink(item) {
        return {
            id: typeof item.id === 'string' && item.id ? item.id : createItemId(),
            icon: normalizeIcon(item.icon),
            label: typeof item.label === 'string' ? item.label : '',
            url: typeof item.url === 'string' ? item.url : '',
        };
    }

    function safeUrl(value) {
        const url = String(value || '').trim();
        if (!url) return '';
        if (url.startsWith('/') || url.startsWith('#')) return url;

        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
        } catch (error) {
            return '';
        }
    }

    function iconPreview(icon) {
        const option = ICON_OPTIONS.find((candidate) => candidate.value === normalizeIcon(icon));
        return el('span', {
            'aria-hidden': 'true',
            className: `dashicons dashicons-${option.dashicon} aloha-page-links-editor__icon`,
        });
    }

    function savedItem(item, index) {
        const url = safeUrl(item.url);
        const content = [
            el('span', {
                'aria-hidden': 'true',
                className: 'aloha-page-links__icon',
                'data-icon': normalizeIcon(item.icon),
                key: 'icon',
            }),
            el('span', { className: 'aloha-page-links__label', key: 'label' }, item.label),
        ];
        const contentProps = {
            className: 'aloha-page-links__link',
            'data-page-link-id': item.id,
        };

        return el(
            'li',
            {
                className: 'aloha-page-links__item',
                'data-page-link-id': item.id,
                key: item.id || index,
            },
            url
                ? el('a', { ...contentProps, href: url }, ...content)
                : el('span', contentProps, ...content)
        );
    }

    registerBlockType('aloha/page-links', {
        apiVersion: 3,
        title: __('Page Links', 'alohaalpha-core'),
        description: __('Editable page destinations displayed as Aloha Academy link buttons.', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'admin-links',
        attributes: {
            links: { type: 'array', default: [], items: { type: 'object' } },
        },
        supports: { align: ['wide', 'full'], anchor: true, html: false, reusable: true },
        edit: function Edit({ attributes, setAttributes }) {
            const links = (attributes.links || []).map(normalizeLink);
            const blockProps = useBlockProps({ className: 'aloha-page-links aloha-page-links-editor' });

            function commit(nextLinks) {
                setAttributes({ links: nextLinks.map(normalizeLink) });
            }

            function update(index, changes) {
                commit(links.map((item, itemIndex) => (
                    itemIndex === index ? { ...item, ...changes } : item
                )));
            }

            function move(index, offset) {
                const destination = index + offset;
                if (destination < 0 || destination >= links.length) return;
                const nextLinks = [...links];
                const [item] = nextLinks.splice(index, 1);
                nextLinks.splice(destination, 0, item);
                commit(nextLinks);
            }

            function addLink() {
                commit([...links, normalizeLink({ id: createItemId() })]);
            }

            return el(
                'section',
                blockProps,
                el(
                    'div',
                    { className: 'aloha-page-links-editor__header' },
                    el('strong', null, __('Page Links', 'alohaalpha-core')),
                    el(Button, { onClick: addLink, variant: 'primary' }, __('Add link', 'alohaalpha-core'))
                ),
                links.length
                    ? el(
                        'ol',
                        { className: 'aloha-page-links-editor__list' },
                        ...links.map((item, index) => el(
                            'li',
                            { className: 'aloha-page-links-editor__item', key: item.id },
                            el(
                                'div',
                                { className: 'aloha-page-links-editor__preview' },
                                iconPreview(item.icon),
                                el(
                                    'span',
                                    null,
                                    item.label || sprintf(__('Link %d', 'alohaalpha-core'), index + 1)
                                )
                            ),
                            el(TextControl, {
                                label: __('Link text', 'alohaalpha-core'),
                                onChange: (label) => update(index, { label }),
                                value: item.label,
                            }),
                            el(SelectControl, {
                                label: __('Font Awesome icon', 'alohaalpha-core'),
                                onChange: (icon) => update(index, { icon: normalizeIcon(icon) }),
                                options: ICON_OPTIONS,
                                value: item.icon,
                            }),
                            LinkControl
                                ? el(
                                    'div',
                                    { className: 'aloha-page-links-editor__destination' },
                                    el('span', { className: 'aloha-page-links-editor__field-label' }, __('Destination', 'alohaalpha-core')),
                                    el(LinkControl, {
                                        onChange: (value) => update(index, { url: value && value.url ? value.url : '' }),
                                        settings: [],
                                        value: { url: item.url },
                                    })
                                )
                                : el(TextControl, {
                                    help: __('Use an internal path or an HTTP(S) URL.', 'alohaalpha-core'),
                                    label: __('Destination URL', 'alohaalpha-core'),
                                    onChange: (url) => update(index, { url }),
                                    type: 'url',
                                    value: item.url,
                                }),
                            el(
                                'div',
                                { className: 'aloha-page-links-editor__actions' },
                                el(Button, {
                                    disabled: index === 0,
                                    onClick: () => move(index, -1),
                                    variant: 'secondary',
                                }, __('Move up', 'alohaalpha-core')),
                                el(Button, {
                                    disabled: index === links.length - 1,
                                    onClick: () => move(index, 1),
                                    variant: 'secondary',
                                }, __('Move down', 'alohaalpha-core')),
                                el(Button, {
                                    isDestructive: true,
                                    onClick: () => commit(links.filter((candidate) => candidate.id !== item.id)),
                                    variant: 'tertiary',
                                }, __('Remove', 'alohaalpha-core'))
                            )
                        ))
                    )
                    : el(
                        Placeholder,
                        {
                            icon: 'admin-links',
                            instructions: __('Add the page destinations to display in this section.', 'alohaalpha-core'),
                            label: __('Page Links', 'alohaalpha-core'),
                        },
                        el(Button, { onClick: addLink, variant: 'primary' }, __('Add first link', 'alohaalpha-core'))
                    )
            );
        },
        save: function Save({ attributes }) {
            const links = (attributes.links || []).map(normalizeLink);
            const blockProps = useBlockProps.save({
                className: 'aloha-page-links',
                'data-page-links-version': '1',
            });

            return el(
                'section',
                blockProps,
                el('ul', { className: 'aloha-page-links__list' }, ...links.map(savedItem))
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
