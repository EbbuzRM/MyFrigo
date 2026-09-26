import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = join(__dirname, '..');
const subjects = JSON.parse(readFileSync(join(directory, 'subjects.json'), 'utf8')) as Record<string, string>;
const codeFlows = ['confirmation', 'recovery', 'reauthentication'];
const linkFlows = ['magic_link', 'invite', 'email_change'];
const flows = [...codeFlows, ...linkFlows, 'password_changed_notification'];

it.each(flows)('%s contains both languages and a bilingual subject', flow => {
  const html = readFileSync(join(directory, `${flow}.html`), 'utf8');
  expect(subjects[flow]).toContain(' / ');
  expect(html).toContain('lang="it"');
  expect(html).toContain('lang="en-GB"');
});

it('uses complete English sentences in the password change notice', () => {
  const html = readFileSync(join(directory, 'password_changed_notification.html'), 'utf8');
  expect(html).toContain('The password for your MyFrigo account has been changed.');
  expect(html).toContain('If this was not you, secure your account immediately.');
  expect(html).not.toMatch(/password been changed|If this not you/);
});

it.each(codeFlows)('%s contains exactly one OTP and no link', flow => {
  const html = readFileSync(join(directory, `${flow}.html`), 'utf8');
  expect(html.match(/{{ \.Token }}/g)).toHaveLength(1);
  expect(html).not.toContain('{{ .ConfirmationURL }}');
});

it.each(linkFlows)('%s contains exactly one confirmation link and no OTP', flow => {
  const html = readFileSync(join(directory, `${flow}.html`), 'utf8');
  expect(html.match(/{{ \.ConfirmationURL }}/g)).toHaveLength(1);
  expect(html).not.toContain('{{ .Token }}');
});
