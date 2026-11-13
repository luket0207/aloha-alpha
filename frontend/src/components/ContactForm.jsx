import { useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';

export const MAX_MESSAGE_LENGTH = 1000;

const INITIAL_VALUES = {
  name: '',
  email: '',
  phone: '',
  message: '',
  website: '',
};

const TEXT = {
  presetPrompt: '以下の質問から選ぶか、お問い合わせ内容をご自由に入力してください。',
  presetsLoading: '質問例を読み込んでいます…',
  presetsUnavailable: '質問例を読み込めませんでした。お問い合わせ内容を直接入力してください。',
  nameRequired: 'お名前を入力してください。',
  emailInvalid: '有効なメールアドレスを入力してください。',
  messageRequired: 'お問い合わせ内容を入力してください。',
  messageTooLong: '1000文字以内で入力してください。',
  accepted: 'お問い合わせを受け付けました。ありがとうございます。',
  failed: '送信できませんでした。時間をおいてもう一度お試しください。',
};

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) errors.name = TEXT.nameRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = TEXT.emailInvalid;
  if (!message) errors.message = TEXT.messageRequired;
  else if (values.message.length > MAX_MESSAGE_LENGTH) errors.message = TEXT.messageTooLong;

  return errors;
}

export default function ContactForm({ presets, presetsStatus }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState('idle');

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (submissionStatus !== 'idle') setSubmissionStatus('idle');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmissionStatus('idle');

    if (Object.keys(nextErrors).length) return;

    setSubmissionStatus('submitting');

    try {
      const response = await fetch(getWordPressRestUrl('aloha/v1/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error(`Contact API error ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error('Contact API rejected the submission');

      setValues(INITIAL_VALUES);
      setErrors({});
      setSubmissionStatus('success');
    } catch (error) {
      console.error(error);
      setSubmissionStatus('error');
    }
  }

  const isSubmitting = submissionStatus === 'submitting';
  const messageHelpId = errors.message ? 'contact-message-error' : 'contact-message-count';

  return (
    <form className="contact-us__form" noValidate onSubmit={handleSubmit}>
      <div className="contact-us__field">
        <label htmlFor="contact-name">お名前</label>
        <input
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          id="contact-name"
          maxLength={100}
          name="name"
          onChange={(event) => updateValue('name', event.target.value)}
          required
          type="text"
          value={values.name}
        />
        {errors.name && <span className="contact-us__error" id="contact-name-error">{errors.name}</span>}
      </div>

      <div className="contact-us__field-row">
        <div className="contact-us__field">
          <label htmlFor="contact-email">メールアドレス</label>
          <input
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="contact-email"
            maxLength={254}
            name="email"
            onChange={(event) => updateValue('email', event.target.value)}
            required
            type="email"
            value={values.email}
          />
          {errors.email && <span className="contact-us__error" id="contact-email-error">{errors.email}</span>}
        </div>

        <div className="contact-us__field">
          <label htmlFor="contact-phone">電話番号（任意）</label>
          <input
            autoComplete="tel"
            id="contact-phone"
            maxLength={50}
            name="phone"
            onChange={(event) => updateValue('phone', event.target.value)}
            type="tel"
            value={values.phone}
          />
        </div>
      </div>

      <fieldset className="contact-us__presets">
        <legend>{TEXT.presetPrompt}</legend>
        {presetsStatus === 'loading' && <p>{TEXT.presetsLoading}</p>}
        {presetsStatus === 'error' && <p className="contact-us__error" role="alert">{TEXT.presetsUnavailable}</p>}
        {presetsStatus === 'ready' && presets.length > 0 && (
          <div className="contact-us__preset-buttons">
            {presets.map((question) => (
              <button
                aria-pressed={values.message === question}
                key={question}
                onClick={() => updateValue('message', question)}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>
        )}
        <button
          aria-controls="contact-message"
          className="contact-us__clear-message"
          onClick={() => updateValue('message', '')}
          type="button"
        >
          入力内容をクリア
        </button>
      </fieldset>

      <div className="contact-us__field">
        <label htmlFor="contact-message">お問い合わせ内容</label>
        <textarea
          aria-describedby={messageHelpId}
          aria-invalid={Boolean(errors.message)}
          id="contact-message"
          maxLength={MAX_MESSAGE_LENGTH}
          name="message"
          onChange={(event) => updateValue('message', event.target.value)}
          required
          value={values.message}
        />
        <span className="contact-us__character-count" id="contact-message-count">
          {values.message.length} / {MAX_MESSAGE_LENGTH}
        </span>
        {errors.message && <span className="contact-us__error" id="contact-message-error">{errors.message}</span>}
      </div>

      <div className="contact-us__honeypot" aria-hidden="true">
        <label htmlFor="contact-website">
          ウェブサイト
          <input
            autoComplete="off"
            id="contact-website"
            name="website"
            onChange={(event) => updateValue('website', event.target.value)}
            tabIndex={-1}
            type="text"
            value={values.website}
          />
        </label>
      </div>

      <button className="contact-us__submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? '送信中…' : '送信する'}
      </button>

      <div aria-live="polite" className="contact-us__submission-status">
        {submissionStatus === 'success' && <p className="is-success">{TEXT.accepted}</p>}
        {submissionStatus === 'error' && <p className="is-error" role="alert">{TEXT.failed}</p>}
      </div>
    </form>
  );
}
