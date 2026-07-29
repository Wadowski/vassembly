import { describe, it, expect } from 'vitest';

import { resolveItemInputSlice } from './resolveItemInputSlice';

describe('resolveItemInputSlice', () => {
  it('should return only referenced slot fields when description contains slot tokens', () => {
    const slice = resolveItemInputSlice({
      templateItem: {
        description: 'Summarize {{documentReference}} for {{reviewerName}}',
      },
      instanceInputDetails: {
        documentReference: 'nda.pdf',
        reviewerName: 'Alex',
        unrelatedField: 'ignored',
      },
    });

    expect(slice).toEqual({
      documentReference: 'nda.pdf',
      reviewerName: 'Alex',
    });
  });

  it('should return full inputDetails when description has no slot references', () => {
    const inputDetails = {
      documentReference: 'nda.pdf',
      reviewerName: 'Alex',
    };

    const slice = resolveItemInputSlice({
      templateItem: {
        description: 'Summarize the uploaded document',
      },
      instanceInputDetails: inputDetails,
    });

    expect(slice).toEqual(inputDetails);
  });
});
