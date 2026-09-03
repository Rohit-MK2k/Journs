import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateEntryDto } from '../update-entry.dto';

describe('UpdateEntryDto', () => {
  it('should validate a valid dto', async () => {
    const dto = new UpdateEntryDto();
    dto.text = 'Updated journal entry.';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if text is empty', async () => {
    const dto = new UpdateEntryDto();
    dto.text = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('text');
  });
});
