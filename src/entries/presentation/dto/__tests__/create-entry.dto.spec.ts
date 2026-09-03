import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateEntryDto, AttachmentDto } from '../create-entry.dto';

describe('CreateEntryDto', () => {
  it('should validate a valid dto without attachments', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'This is a journal entry.';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid dto with attachments', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'This is a journal entry.';
    
    const attachment = new AttachmentDto();
    attachment.type = 'photo';
    attachment.url = 'https://example.com/photo.jpg';
    dto.attachments = [attachment];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if text is empty', async () => {
    const dto = new CreateEntryDto();
    dto.text = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('text');
  });

  it('should fail if attachment has invalid type', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'Valid text';
    
    const attachment = new AttachmentDto();
    attachment.type = 'invalid_type' as any;
    attachment.url = 'https://example.com/photo.jpg';
    dto.attachments = [attachment];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('attachments');
  });
});
