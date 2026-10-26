import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../src/guards/firebase-auth.guard';

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
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target FirebaseAuthGuard.canActivate
   * @description Verifies that access is granted and the decoded token payload is attached to the request when a valid Bearer token is provided.
   */
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

  /**
   * @testType Unit Test
   * @target FirebaseAuthGuard.canActivate
   * @description Verifies that UnauthorizedException is thrown when no authorization header is present in the request.
   */
  it('should throw UnauthorizedException if no auth header', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  /**
   * @testType Unit Test
   * @target FirebaseAuthGuard.canActivate
   * @description Verifies that UnauthorizedException is thrown when the provided Bearer token fails validation.
   */
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
