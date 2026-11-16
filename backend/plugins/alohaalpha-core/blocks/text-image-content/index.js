(function (blocks, blockEditor, element, i18n) {
    const { registerBlockType } = blocks;
    const { InnerBlocks, useBlockProps } = blockEditor;
    const { createElement: el } = element;
    const { __ } = i18n;
    const ALLOWED_BLOCKS = ['core/heading', 'core/paragraph'];
    const TEMPLATE = [[
        'core/paragraph',
        { placeholder: __('Add text…', 'alohaalpha-core') },
    ]];

    registerBlockType('aloha/text-image-content', {
        apiVersion: 3,
        title: __('Side by Side — Text Area', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'text-page',
        parent: ['aloha/text-image-side-by-side'],
        supports: { html: false, inserter: false, reusable: false },
        edit: function Edit() {
            return el(
                'div',
                useBlockProps({ className: 'aloha-text-image__content' }),
                el(InnerBlocks, {
                    allowedBlocks: ALLOWED_BLOCKS,
                    orientation: 'vertical',
                    template: TEMPLATE,
                    templateLock: false,
                })
            );
        },
        save: function Save() {
            return el(
                'div',
                useBlockProps.save({ className: 'aloha-text-image__content' }),
                el(InnerBlocks.Content)
            );
        },
    });
})(window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.i18n);
