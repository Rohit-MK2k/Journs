import { AccountController } from '../account.controller';

describe('AccountController', () => {
  let controller: AccountController;
  let service: any;

  beforeEach(() => {
    service = {
      wipeUserData: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AccountController(service);
  });

  it('should call wipeUserData', async () => {
    await controller.deleteAccount({ user: { uid: 'u1' } });
    expect(service.wipeUserData).toHaveBeenCalledWith('u1');
  });

  it('should update settings', async () => {
    const res = await controller.updateSettings({ user: { uid: 'u1' } }, { theme: 'dark' });
    expect(res.updatedSettings.theme).toBe('dark');
  });
});
