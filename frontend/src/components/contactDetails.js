function parseOpeningHours(json) {
  let entries;
  try {
    entries = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(entries)) return [];

  return entries.flatMap((entry) => {
    const days = typeof entry?.days === 'string' ? entry.days.trim() : '';
    const times = typeof entry?.times === 'string' ? entry.times.trim() : '';
    return days && times ? [{ days, times }] : [];
  });
}

export function contactDetailsFromElement(element) {
  if (!element) return null;

  const { address, companyName, email, openingHours, telephone } = element.dataset;
  const details = {
    address: address?.trim() || '',
    companyName: companyName?.trim() || '',
    email: email?.trim() || '',
    telephone: telephone?.trim() || '',
    openingHours: parseOpeningHours(openingHours),
  };

  return details.address || details.companyName || details.email || details.telephone || details.openingHours.length
    ? details
    : null;
}

export function emailHref(email) {
  const match = /^([^\s@]+)@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i.exec(email);
  return match ? `mailto:${encodeURIComponent(match[1])}@${match[2]}` : undefined;
}

export function telephoneHref(telephone) {
  const number = telephone.replace(/[\s().-]/g, '');
  return /^\+?[0-9]+$/.test(number) ? `tel:${number}` : undefined;
}
