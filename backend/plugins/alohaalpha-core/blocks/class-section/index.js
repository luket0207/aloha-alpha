(function (blocks, blockEditor, components, coreData, data, element, i18n) {
    const { registerBlockType, registerBlockVariation } = blocks;
    const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
    const { Button, Flex, PanelBody, SelectControl, TextControl, TextareaControl } = components;
    const { createElement: el, Fragment } = element;
    const { __, sprintf } = i18n;

    const blockName = 'aloha/class-section';
    const classes = [
        { classId: 'kids', colorStyle: 'a', title: __('Kids Class', 'alohaalpha-core') },
        { classId: 'first-class', colorStyle: 'b', title: __('First Class', 'alohaalpha-core') },
        { classId: 'second-class', colorStyle: 'a', title: __('Second Class', 'alohaalpha-core') },
        { classId: 'third-class', colorStyle: 'b', title: __('Third Class', 'alohaalpha-core') },
    ];
    const weekdays = [
        { value: 'monday', label: __('Monday', 'alohaalpha-core') },
        { value: 'tuesday', label: __('Tuesday', 'alohaalpha-core') },
        { value: 'wednesday', label: __('Wednesday', 'alohaalpha-core') },
        { value: 'thursday', label: __('Thursday', 'alohaalpha-core') },
        { value: 'friday', label: __('Friday', 'alohaalpha-core') },
        { value: 'saturday', label: __('Saturday', 'alohaalpha-core') },
        { value: 'sunday', label: __('Sunday', 'alohaalpha-core') },
    ];

    function createId() {
        return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function moveDay(timetable, index, offset) {
        const reordered = [...timetable];
        const [day] = reordered.splice(index, 1);
        reordered.splice(index + offset, 0, day);
        return reordered;
    }

    function emptyLesson() {
        return { id: createId(), start: '', end: '' };
    }

    function ImageControls({ frameType, imageId, setAttributes }) {
        const image = data.useSelect(
            (select) => imageId ? select(coreData.store).getMedia(imageId) : null,
            [imageId]
        );
        const preview = image?.media_details?.sizes?.medium?.source_url || image?.source_url;

        return el(
            PanelBody,
            { title: __('Featured image', 'alohaalpha-core'), initialOpen: true },
            preview && el('img', {
                alt: image.alt_text || '',
                src: preview,
                width: 280,
            }),
            el(
                MediaUploadCheck,
                null,
                el(MediaUpload, {
                    allowedTypes: ['image'],
                    onSelect: (attachment) => setAttributes({ imageId: attachment.id }),
                    render: ({ open }) => el(
                        Button,
                        { onClick: open, variant: 'secondary' },
                        imageId ? __('Replace image', 'alohaalpha-core') : __('Select image', 'alohaalpha-core')
                    ),
                    value: imageId,
                })
            ),
            imageId && el(Button, {
                isDestructive: true,
                onClick: () => setAttributes({ imageId: undefined }),
                variant: 'tertiary',
            }, __('Remove image', 'alohaalpha-core')),
            el(SelectControl, {
                __nextHasNoMarginBottom: true,
                __next40pxDefaultSize: true,
                label: __('Image Frame Style', 'alohaalpha-core'),
                options: [
                    { value: 'round', label: __('Round Frame', 'alohaalpha-core') },
                    { value: 'square', label: __('Square Frame', 'alohaalpha-core') },
                ],
                value: frameType,
                onChange: (value) => setAttributes({ frameType: value }),
            })
        );
    }

    function LessonControls({ lesson, number, onChange, onRemove }) {
        const invalidRange = Boolean(lesson.start && lesson.end && lesson.end <= lesson.start);
        return el(
            'fieldset',
            null,
            el('legend', null, sprintf(__('Lesson %d', 'alohaalpha-core'), number)),
            el(
                Flex,
                { align: 'start', justify: 'start', wrap: true },
                el(TextControl, {
                    __nextHasNoMarginBottom: true,
                    __next40pxDefaultSize: true,
                    label: __('Start time', 'alohaalpha-core'),
                    type: 'time',
                    step: 60,
                    value: lesson.start,
                    onChange: (start) => onChange({ ...lesson, start }),
                }),
                el(TextControl, {
                    __nextHasNoMarginBottom: true,
                    __next40pxDefaultSize: true,
                    'aria-invalid': invalidRange || undefined,
                    help: invalidRange ? __('End time must be later than start time.', 'alohaalpha-core') : undefined,
                    label: __('End time', 'alohaalpha-core'),
                    type: 'time',
                    step: 60,
                    value: lesson.end,
                    onChange: (end) => onChange({ ...lesson, end }),
                })
            ),
            el(Button, { isDestructive: true, onClick: onRemove, variant: 'tertiary' }, __('Remove lesson', 'alohaalpha-core'))
        );
    }

    function DayControls({ day, index, timetable, onChange }) {
        function updateDay(changes) {
            onChange(timetable.map((item) => item.id === day.id ? { ...item, ...changes } : item));
        }

        return el(
            PanelBody,
            {
                title: weekdays.find((item) => item.value === day.weekday)?.label,
                initialOpen: true,
            },
            el(SelectControl, {
                __nextHasNoMarginBottom: true,
                __next40pxDefaultSize: true,
                label: __('Weekday', 'alohaalpha-core'),
                onChange: (weekday) => updateDay({ weekday }),
                options: weekdays,
                value: day.weekday,
            }),
            ...day.lessons.map((lesson, lessonIndex) => el(LessonControls, {
                key: lesson.id,
                lesson,
                number: lessonIndex + 1,
                onChange: (updated) => updateDay({
                    lessons: day.lessons.map((item) => item.id === updated.id ? updated : item),
                }),
                onRemove: () => updateDay({ lessons: day.lessons.filter((item) => item.id !== lesson.id) }),
            })),
            el(
                Flex,
                { justify: 'start', wrap: true },
                el(Button, {
                    onClick: () => updateDay({ lessons: [...day.lessons, emptyLesson()] }),
                    variant: 'secondary',
                }, __('Add lesson', 'alohaalpha-core')),
                el(Button, {
                    disabled: index === 0,
                    onClick: () => onChange(moveDay(timetable, index, -1)),
                }, __('Move day up', 'alohaalpha-core')),
                el(Button, {
                    disabled: index === timetable.length - 1,
                    onClick: () => onChange(moveDay(timetable, index, 1)),
                }, __('Move day down', 'alohaalpha-core')),
                el(Button, {
                    isDestructive: true,
                    onClick: () => onChange(timetable.filter((item) => item.id !== day.id)),
                    variant: 'tertiary',
                }, __('Remove day', 'alohaalpha-core'))
            )
        );
    }

    registerBlockType(blockName, {
        edit: function Edit({ attributes, setAttributes }) {
            const { classId, colorStyle, frameType, imageId, introduction, timetable, title } = attributes;
            const blockProps = useBlockProps();
            const colorLabel = colorStyle === 'b'
                ? __('Style B · Light Blue', 'alohaalpha-core')
                : __('Style A · Light Background', 'alohaalpha-core');
            const addDay = () => {
                const nextDay = weekdays.find(({ value }) => !timetable.some((day) => day.weekday === value));
                setAttributes({
                    timetable: [...timetable, {
                        id: createId(),
                        weekday: (nextDay || weekdays[0]).value,
                        lessons: [emptyLesson()],
                    }],
                });
            };

            return el(
                Fragment,
                null,
                el(InspectorControls, null, el(PanelBody, { title: __('Class settings', 'alohaalpha-core') },
                    el('p', null, sprintf(__('Section anchor: #%s', 'alohaalpha-core'), classId)),
                    el('p', null, colorLabel)
                )),
                el(
                    'section',
                    blockProps,
                    el(TextControl, {
                        __next40pxDefaultSize: true,
                        label: __('Class title', 'alohaalpha-core'),
                        onChange: (value) => setAttributes({ title: value }),
                        value: title,
                    }),
                    el(TextareaControl, {
                        __nextHasNoMarginBottom: true,
                        label: __('Introduction', 'alohaalpha-core'),
                        help: __('Start a new line for each paragraph.', 'alohaalpha-core'),
                        onChange: (value) => setAttributes({ introduction: value }),
                        rows: 4,
                        value: introduction,
                    }),
                    el(ImageControls, { frameType, imageId, setAttributes }),
                    el(
                        PanelBody,
                        { title: __('Weekly timetable', 'alohaalpha-core'), initialOpen: true },
                        ...timetable.map((day, index) => el(DayControls, {
                            key: day.id,
                            day,
                            index,
                            timetable,
                            onChange: (value) => setAttributes({ timetable: value }),
                        })),
                        el(Button, { onClick: addDay, variant: 'secondary' }, __('Add timetable day', 'alohaalpha-core'))
                    )
                )
            );
        },
        save: () => null,
    });

    classes.forEach(({ classId, colorStyle, title }, index) => {
        registerBlockVariation(blockName, {
            name: classId,
            title,
            attributes: { classId, colorStyle, title },
            isActive: ['classId'],
            isDefault: index === 0,
            scope: ['inserter'],
        });
    });
})(window.wp.blocks, window.wp.blockEditor, window.wp.components, window.wp.coreData, window.wp.data, window.wp.element, window.wp.i18n);
