import { emailHref, telephoneHref } from './contactDetails.js';

function ContactValue({ href, value }) {
  if (!value) return null;
  return <p>{href ? <a href={href}>{value}</a> : value}</p>;
}

export default function ContactDetails({ address, companyName, email, openingHours, telephone }) {
  return (
    <div className="contact-us__details">
      {(companyName || address || email || telephone) && (
        <address>
          {companyName && <p><strong>{companyName}</strong></p>}
          {address && <p>{address}</p>}
          <ContactValue href={emailHref(email)} value={email} />
          <ContactValue href={telephoneHref(telephone)} value={telephone} />
        </address>
      )}
      {openingHours.length > 0 && (
        <div className="contact-us__hours">
          <p><strong>営業時間</strong></p>
          <ul role="list">
            {openingHours.map(({ days, times }, index) => (
              <li key={index}>{days} {times}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
