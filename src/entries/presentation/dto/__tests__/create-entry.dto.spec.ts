import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  CreateEntryDto,
  AttachmentPhotoDto,
  AttachmentVoiceDto,
  AttachmentLocationDto,
} from '../create-entry.dto';

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
