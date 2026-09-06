import { countWords, isProgrammingCode, shouldSummarize } from '../summarization.util';

describe('summarization.util', () => {
  describe('countWords', () => {
    it('should count words accurately', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('hello world')).toBe(2);
      expect(countWords('One two three four five six seven eight nine ten')).toBe(10);
    });
  });

  describe('isProgrammingCode', () => {
    it('should detect markdown code fences', () => {
      const code = 'Here is code:\n```typescript\nconst x = 10;\n```';
      expect(isProgrammingCode(code)).toBe(true);
    });

    it('should detect typical programming constructs', () => {
      expect(isProgrammingCode('import React from "react";\nconst App = () => null;')).toBe(true);
      expect(isProgrammingCode('function calculateTotal(items) { return items.length; }')).toBe(true);
      expect(isProgrammingCode('public class Main { public static void main() {} }')).toBe(true);
      expect(isProgrammingCode('def process_data(input_list):')).toBe(true);
    });

    it('should return false for regular natural prose', () => {
      const text = 'Today was a wonderful and peaceful day. I woke up early, enjoyed a warm cup of coffee, and walked outside in the gentle morning breeze.';
      expect(isProgrammingCode(text)).toBe(false);
    });
  });

  describe('shouldSummarize', () => {
    it('should return false when word count is 20 or less', () => {
      const twentyWords = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty';
      expect(countWords(twentyWords)).toBe(20);
      expect(shouldSummarize(twentyWords)).toBe(false);
    });

    it('should return false for programming code even if long', () => {
      const longCode = `
import { Injectable } from '@nestjs/common';
import { EntryRepository } from './entry-repository';

@Injectable()
export class EntryService {
  constructor(private readonly repo: EntryRepository) {}
  async findOne(id: string) {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new Error('Not found');
    }
    return item;
  }
}
      `;
      expect(shouldSummarize(longCode)).toBe(false);
    });

    it('should return true for natural journal prose with more than 20 words', () => {
      const validEntry = 'Today was a truly delightful morning where I spent several quiet hours walking through the park, watching the sun rise, and reflecting on how far my projects have progressed this year.';
      expect(countWords(validEntry)).toBeGreaterThan(20);
      expect(shouldSummarize(validEntry)).toBe(true);
    });
  });
});
