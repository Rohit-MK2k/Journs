import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateEntryDto } from '@journ/entries/presentation/dto/update-entry.dto';

describe('UpdateEntryDto', () => {
  /**
   * @testType Unit Test
   * @target UpdateEntryDto
   * @description Verifies that a valid update DTO with non-empty text passes validation.
   */
  it('should validate a valid dto', async () => {
    const dto = new UpdateEntryDto();
    dto.text = 'Updated journal entry.';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target UpdateEntryDto
   * @description Verifies that validation fails if text is empty.
   */
  it('should fail if text is empty', async () => {
    const dto = new UpdateEntryDto();
    dto.text = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('text');
  });
});
