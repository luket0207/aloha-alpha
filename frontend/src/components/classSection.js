import { imageFrameDataFromElement } from './imageFrame.js';

const CLASS_ANCHORS = ['kids', 'first-class', 'second-class', 'third-class'];
const TIME = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
const WEEKDAYS = {
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
  sunday: '日曜日',
};

export function parseClassTimetable(json) {
  let timetable;
  try {
    timetable = JSON.parse(json);
  } catch {
    return [];
  }

  if (!timetable || typeof timetable !== 'object') return [];

  return Object.entries(timetable).flatMap(([weekday, ranges]) => {
    if (!Object.hasOwn(WEEKDAYS, weekday) || !Array.isArray(ranges)) return [];

    const lessons = ranges.filter((range) => (
      typeof range?.start === 'string'
      && typeof range.end === 'string'
      && TIME.test(range.start)
      && TIME.test(range.end)
      && range.start < range.end
    ));
    return lessons.length ? [{ weekday, label: WEEKDAYS[weekday], lessons }] : [];
  });
}

export function classSectionDataFromElement(element) {
  if (!CLASS_ANCHORS.includes(element.id)) return null;

  const media = element.querySelector(':scope > figure[data-frame-type]');
  return {
    id: element.id,
    colorScheme: element.dataset.colorStyle === 'b' ? 'light-blue' : 'cream',
    title: element.querySelector(':scope > h2')?.textContent.trim() || '',
    paragraphs: Array.from(
      element.querySelectorAll(':scope > .aloha-class-introduction > p'),
      (paragraph) => paragraph.textContent.trim(),
    ).filter(Boolean),
    frame: media ? imageFrameDataFromElement(media) : null,
    timetable: parseClassTimetable(element.dataset.timetable),
  };
}
