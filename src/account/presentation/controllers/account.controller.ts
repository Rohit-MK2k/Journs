import { Controller, Patch, Delete, Req, Body } from '@nestjs/common';
import { AccountService } from '../../services/account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() settings: any) {
    // Stub for updating preferences (Habit Memory toggles, etc.)
    return {
      uid: req.user.uid,
      status: 'success',
      updatedSettings: settings,
    };
  }

  @Delete()
  async deleteAccount(@Req() req: any) {
    await this.accountService.wipeUserData(req.user.uid);
    return {
      uid: req.user.uid,
      status: 'success',
      message: 'Account deleted',
    };
  }
}
