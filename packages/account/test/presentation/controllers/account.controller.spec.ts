import { AccountController } from '@journ/account/presentation/controllers/account.controller';

describe('AccountController', () => {
  let controller: AccountController;
  let service: { wipeUserData: jest.Mock };

  beforeEach(() => {
    service = {
      wipeUserData: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AccountController(service as any);
  });

  /**
   * @testType Unit Test
   * @target AccountController.deleteAccount
   * @description Verifies that the deleteAccount endpoint extracts the user id from the request, invokes AccountService.wipeUserData, and returns a success payload.
   */
  it('should call wipeUserData on deleteAccount', async () => {
    const res = await controller.deleteAccount({ user: { uid: 'u1' } });

    expect(service.wipeUserData).toHaveBeenCalledWith('u1');
    expect(res).toEqual({
      uid: 'u1',
      status: 'success',
      message: 'Account deleted',
    });
  });

  /**
   * @testType Unit Test
   * @target AccountController.updateSettings
   * @description Verifies that the updateSettings endpoint accepts user settings changes and returns the updated settings payload.
   */
  it('should return updated settings on updateSettings', async () => {
    const res = await controller.updateSettings({ user: { uid: 'u1' } }, { theme: 'dark' });

    expect(res).toEqual({
      uid: 'u1',
      status: 'success',
      updatedSettings: { theme: 'dark' },
    });
  });
});
