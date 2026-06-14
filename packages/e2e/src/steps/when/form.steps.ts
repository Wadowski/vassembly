import { When } from '../../fixtures/bddTest';

const FORM_LABEL_ALIASES: Record<string, string> = {
  Instructions: 'Rule',
};

const resolveFormLabel = (label: string): string => FORM_LABEL_ALIASES[label] ?? label;

When('I check {string}', async ({ page }, label: string) => {
  if (!page) {
    return;
  }

  await page.getByRole('checkbox', { name: label }).check();
});

When('I fill in {string} with {string}', async ({ page }, label: string, value: string) => {
  if (!page) {
    return;
  }

  const resolvedLabel = resolveFormLabel(label);
  const labelField = page.getByLabel(resolvedLabel, { exact: true });
  try {
    await labelField.fill(value, { timeout: 2_000 });
    return;
  } catch {
    await page.getByRole('textbox', { name: resolvedLabel, exact: true }).fill(value);
  }
});

When('I click {string}', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  const button = page.getByRole('button', { name: new RegExp(text, 'i') });
  await button.first().click();
});

When('I fill in the form:', async ({ page }, table) => {
  if (!page) {
    return;
  }

  const rows = table.rows();
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const label = row[0];
    const value = row[1];

    if (!label || value === undefined) {
      continue;
    }

    const labelField = page.getByLabel(label, { exact: true });
    try {
      await labelField.fill(value, { timeout: 2_000 });
      continue;
    } catch {
      await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    }
  }
});
