import assert from 'node:assert/strict';
import test from 'node:test';
import { contactDetailsFromElement, emailHref, telephoneHref } from './contactDetails.js';

test('reads the saved contact fields and preserves the order of complete hours entries', () => {
  const details = contactDetailsFromElement({
    dataset: {
      companyName: '英会話教室',
      address: '東京都羽村市',
      email: 'contact@example.test',
      telephone: '080-0000-0000',
      openingHours: JSON.stringify([
        { days: '火曜日-金曜日', times: '15:00-19:00' },
        { days: '土曜日', times: '9:30-16:30' },
        { days: '日曜日', times: '' },
        null,
      ]),
    },
  });
  assert.deepEqual(details, {
    companyName: '英会話教室',
    address: '東京都羽村市',
    email: 'contact@example.test',
    telephone: '080-0000-0000',
    openingHours: [
      { days: '火曜日-金曜日', times: '15:00-19:00' },
      { days: '土曜日', times: '9:30-16:30' },
    ],
  });
  assert.equal(contactDetailsFromElement({ dataset: { openingHours: 'invalid' } }), null);
  assert.equal(contactDetailsFromElement(null), null);
});

test('builds contact links from the saved values without interpreting URI query characters', () => {
  assert.equal(emailHref('contact@example.test'), 'mailto:contact@example.test');
  assert.equal(emailHref('a?b@example.test'), 'mailto:a%3Fb@example.test');
  assert.equal(emailHref('a@example.test?bcc=b@example.test'), undefined);
  assert.equal(telephoneHref('080-0000-0000'), 'tel:08000000000');
  assert.equal(telephoneHref('+81 (42) 000-0000'), 'tel:+81420000000');
  assert.equal(telephoneHref('javascript:123'), undefined);
});
