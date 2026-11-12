(function (blocks, domReady, i18n) {
    const { registerBlockVariation } = blocks;
    const { __ } = i18n;

    function hasClass(className, expectedClass) {
        return (` ${className || ''} `).includes(` ${expectedClass} `);
    }

    function registerHeadingVariation(language, level) {
        const languageLabel = language === 'latin' ? __('Latin', 'alohaalpha-core') : __('Japanese', 'alohaalpha-core');
        const typographyClass = `aloha-heading--${language}`;

        registerBlockVariation('core/heading', {
            name: `aloha-${language}-h${level}`,
            title: `${languageLabel} H${level}`,
            description: __('A semantic heading using the Aloha Academy type system.', 'alohaalpha-core'),
            attributes: {
                level,
                className: typographyClass,
            },
            scope: ['inserter', 'transform'],
            keywords: [languageLabel, `H${level}`, __('Aloha Academy', 'alohaalpha-core')],
            isActive: (attributes) => attributes.level === level && hasClass(attributes.className, typographyClass),
        });
    }

    domReady(function () {
        ['latin', 'japanese'].forEach(function (language) {
            [1, 2, 3, 4, 5].forEach(function (level) {
                registerHeadingVariation(language, level);
            });
        });
    });
})(window.wp.blocks, window.wp.domReady, window.wp.i18n);
