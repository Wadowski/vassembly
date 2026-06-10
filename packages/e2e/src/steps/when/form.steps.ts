import { When } from '../../fixtures/bddTest';

When('I fill in {string} with {string}', async ({ page }, label: string, value: string) => {
  if (!page) {
    return;
  }

  const labelField = page.getByLabel(label);
  const labelCount = await labelField.count();
  if (labelCount > 0) {
    await labelField.fill(value);
    return;
  }

  await page.getByTestId(label).fill(value);
});

When('I click {string}', async ({ page }, text: string) => {
  if (!page) {
    return;
  }

  await page.getByRole('button', { name: text }).click();
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

    const labelField = page.getByLabel(label);
    const labelCount = await labelField.count();
    if (labelCount > 0) {
      await labelField.fill(value);
      continue;
    }

    await page.getByTestId(label).fill(value);
  }
});
