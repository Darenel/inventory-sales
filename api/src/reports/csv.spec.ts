import { buildCsv, escapeCsvValue } from './csv';

describe('csv helpers', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(escapeCsvValue('ACME, Inc.')).toBe('"ACME, Inc."');
    expect(escapeCsvValue('12" monitor')).toBe('"12"" monitor"');
    expect(escapeCsvValue('line one\nline two')).toBe('"line one\nline two"');
  });

  it('builds a csv document with a header row', () => {
    expect(
      buildCsv(
        ['Name', 'Note'],
        [
          ['ACME, Inc.', 'line one\nline two'],
          ['Quote', '12" monitor'],
        ],
      ),
    ).toBe('Name,Note\r\n"ACME, Inc.","line one\nline two"\r\nQuote,"12"" monitor"\r\n');
  });
});
