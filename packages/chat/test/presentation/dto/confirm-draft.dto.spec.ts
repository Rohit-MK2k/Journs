import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConfirmDraftDto } from '@journ/chat/presentation/dto/confirm-draft.dto';

describe('ConfirmDraftDto', () => {
  /**
   * @testType Unit Test
   * @target ConfirmDraftDto
   * @description Verifies validation success for valid new target payload.
   */
  it('should validate valid new target', async () => {
    const dto = plainToInstance(ConfirmDraftDto, {
      draft: { text: 'draft text', sourceContext: 'ctx' },
      target: 'new',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * @testType Unit Test
   * @target ConfirmDraftDto
   * @description Verifies validation success for valid today target payload.
   */
  it('should validate valid today target', async () => {
    const dto = plainToInstance(ConfirmDraftDto, {
      draft: { text: 'draft text', sourceContext: 'ctx' },
      target: 'today',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
