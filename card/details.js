// Shared presentation keeps owner and recipient contact details identical.
export function renderContactDetails(profile, translate) {
  const $ = id => document.getElementById(id);
  $('profile-description').textContent = profile.description || '';
  $('profile-description').hidden = !profile.description;
  for (const key of ['phone', 'email', 'website', 'address']) {
    $('detail-' + key).hidden = !profile[key];
    $(key + '-value').textContent = key === 'website' ? profile[key].replace(/^https?:\/\//, '').replace(/\/$/, '') : key === 'address' ? translate(profile[key]) : profile[key];
  }
  const greekPhone = /^\+30(?:2\d{9}|69\d{8})$/.test(profile.phone);
  $('phone-flag').toggleAttribute('hidden', !greekPhone);
  if (greekPhone) $('phone-value').textContent = '+30 ' + profile.phone.slice(3);
  $('phone-value').href = 'tel:' + profile.phone;
  $('email-value').href = 'mailto:' + profile.email;
  $('website-value').href = profile.website;
}
