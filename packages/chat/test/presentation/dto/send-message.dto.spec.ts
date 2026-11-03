import 'reflect-metadata';
import { validate } from 'class-validator';
import { SendMessageDto } from '@journ/chat/presentation/dto/send-message.dto';

describe('SendMessageDto', () => {
  /**
   * @testType Unit Test
   * @target SendMessageDto
   * @description Verifies validation success for valid text mode payload.
   */
  it('should validate a text message', async () => {
    const dto = new SendMessageDto();
    dto.message = 'Hello world';
    dto.mode = 'text';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target SendMessageDto
   * @description Verifies validation success for valid voice mode payload.
   */
  it('should validate a voice message', async () => {
    const dto = new SendMessageDto();
    dto.message = 'transcript of voice';
    dto.mode = 'voice';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target SendMessageDto
   * @description Verifies validation failure when mode is invalid.
   */
  it('should fail on invalid mode', async () => {
    const dto = new SendMessageDto();
    dto.message = 'Hello';
    dto.mode = 'invalid' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('mode');
  });
});
