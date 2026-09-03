import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../firebase-auth.guard';

import { getAuth } from 'firebase-admin/auth';

const verifyIdTokenMock = jest.fn();

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
  }),
}));

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;

  beforeEach(() => {
    guard = new FirebaseAuthGuard();
  });

  it('should allow access if token is valid', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    verifyIdTokenMock.mockResolvedValue({ uid: 'user123' });

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect((mockRequest as any).user).toEqual({ uid: 'user123' });
  });

  it('should throw UnauthorizedException if no auth header', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer invalid' } }),
      }),
    } as ExecutionContext;

    verifyIdTokenMock.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});
