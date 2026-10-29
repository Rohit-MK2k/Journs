import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  CreateEntryDto,
  AttachmentPhotoDto,
  AttachmentVoiceDto,
  AttachmentLocationDto,
} from '@journ/entries/presentation/dto/create-entry.dto';

describe('CreateEntryDto', () => {
  /**
   * @testType Unit Test
   * @target CreateEntryDto
   * @description Verifies that a valid DTO with only text passes validation.
   */
  it('should validate a valid dto without attachments', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'This is a journal entry.';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target CreateEntryDto
   * @description Verifies that a valid DTO with multiple valid attachments passes validation.
   */
  it('should validate a valid dto with attachments', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'This is a journal entry.';
    
    const photo = new AttachmentPhotoDto();
    photo.type = 'photo';
    photo.url = 'https://example.com/photo.jpg';
    photo.filePath = 'users/u1/photo.jpg';
    photo.fileId = 'f1';

    const location = new AttachmentLocationDto();
    location.type = 'location';
    location.lat = 37.7749;
    location.lng = -122.4194;
    location.locationLabel = 'San Francisco, CA';

    dto.attachments = [photo, location];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target CreateEntryDto
   * @description Verifies that validation fails if text is empty.
   */
  it('should fail if text is empty', async () => {
    const dto = new CreateEntryDto();
    dto.text = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('text');
  });

  /**
   * @testType Unit Test
   * @target CreateEntryDto
   * @description Verifies that validation fails if an attachment has an invalid type discriminator.
   */
  it('should fail if attachment has invalid type', async () => {
    const dto = new CreateEntryDto();
    dto.text = 'Valid text';
    
    const photo = new AttachmentPhotoDto();
    photo.type = 'invalid_type' as any;
    photo.url = 'https://example.com/photo.jpg';
    photo.filePath = 'users/u1/photo.jpg';
    photo.fileId = 'f1';
    dto.attachments = [photo];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('attachments');
  });
});
