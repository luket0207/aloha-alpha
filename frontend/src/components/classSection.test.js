import assert from 'node:assert/strict';
import test from 'node:test';
import { classSectionDataFromElement, parseClassTimetable } from './classSection.js';

test('preserves weekday and session order and skips invalid timetable values', () => {
  const monday = [{ start: '16:00', end: '16:50' }];
  const saturday = [
    { start: '09:30', end: '10:20' },
    { start: '10:30', end: '11:20' },
  ];
  assert.deepEqual(parseClassTimetable(JSON.stringify({
    saturday,
    tuesday: [{ start: '18:00', end: '17:00' }],
    wednesday: [{ start: '9:00', end: '10:00' }],
    monday: [...monday, null, { start: '23:30', end: '24:00' }],
    unknown: monday,
  })), [
    { weekday: 'saturday', label: '土曜日', lessons: saturday },
    { weekday: 'monday', label: '月曜日', lessons: monday },
  ]);
  assert.deepEqual(parseClassTimetable('invalid'), []);
  assert.deepEqual(parseClassTimetable('[]'), []);
});

test('reads the saved style, stable anchor, and plain Japanese paragraphs', () => {
  const section = {
    id: 'first-class',
    dataset: { colorStyle: 'b', timetable: '[]' },
    querySelector: (selector) => selector === ':scope > h2' ? { textContent: 'First Class' } : null,
    querySelectorAll: () => [{ textContent: '最初の段落' }, { textContent: '次の段落' }],
  };
  assert.deepEqual(classSectionDataFromElement(section), {
    id: 'first-class',
    colorScheme: 'light-blue',
    title: 'First Class',
    paragraphs: ['最初の段落', '次の段落'],
    frame: null,
    timetable: [],
  });
  assert.equal(classSectionDataFromElement({ ...section, id: 'arbitrary-id' }), null);
});
