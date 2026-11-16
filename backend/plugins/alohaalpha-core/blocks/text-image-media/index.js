(function (blocks, blockEditor, element, i18n) {
    const { registerBlockType } = blocks;
    const { InnerBlocks, useBlockProps } = blockEditor;
    const { createElement: el } = element;
    const { __ } = i18n;
    const TEMPLATE = [['aloha/image-frame', { frameType: 'round' }]];

    registerBlockType('aloha/text-image-media', {
        apiVersion: 3,
        title: __('Side by Side — Image Area', 'alohaalpha-core'),
        category: 'aloha-layouts',
        icon: 'format-image',
        parent: ['aloha/text-image-side-by-side'],
        supports: { html: false, inserter: false, reusable: false },
        edit: function Edit() {
            return el(
                'div',
                useBlockProps({ className: 'aloha-text-image__media' }),
                el(InnerBlocks, {
                    allowedBlocks: ['aloha/image-frame'],
                    renderAppender: false,
                    template: TEMPLATE,
                    templateLock: 'all',
                })
            );
        },
        save: function Save() {
            return el(
                'div',
                useBlockProps.save({ className: 'aloha-text-image__media' }),
                el(InnerBlocks.Content)
            );
        },
    });
})(window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.i18n);
