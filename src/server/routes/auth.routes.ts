/**
 * Authentication Routes
 * Handles user registration, login, logout, and password management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prismaClient } from '../config/database';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { strictRateLimit } from '../middleware/rate-limit';
import { asyncHandler } from '../middleware/error-handler';
import { responseFormats } from '../config/api.config';
import { logAuth } from '../utils/logger';
// import { sendEmail } from '../utils/email'; // TODO: Implement email service

const router = Router();

// ==================== ROUTE HANDLERS ====================

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  strictRateLimit(5, 60000), // 5 registrations per minute
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, acceptTerms } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      res.status(400).json(responseFormats.error('Missing required fields', 'VALIDATION_ERROR'));
      return;
    }

    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json(responseFormats.error(
        'Email already registered',
        'EMAIL_EXISTS'
      ));
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await prismaClient.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // TODO: Send verification email
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Verify Your ChromaVault Account',
    //   template: 'verify-email',
    //   data: { verificationToken, name: user.name },
    // });

    logAuth('User registered', user.id, { email: user.email });

    res.status(201).json(responseFormats.success(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      'Registration successful. Please check your email to verify your account.'
    ));
  })
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login',
  strictRateLimit(10, 60000), // 10 login attempts per minute
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;

    // Basic validation
    if (!email || !password) {
      res.status(400).json(responseFormats.error('Missing email or password', 'VALIDATION_ERROR'));
      return;
    }

    // Find user
    const user = await prismaClient.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      res.status(401).json(responseFormats.error(
        'Invalid email or password',
        'INVALID_CREDENTIALS'
      ));
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json(responseFormats.error(
        'Invalid email or password',
        'INVALID_CREDENTIALS'
      ));
      return;
    }

    // Check if user is verified
    if (!user.isVerified) {
      res.status(401).json(responseFormats.error(
        'Please verify your email before logging in',
        'EMAIL_NOT_VERIFIED'
      ));
      return;
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await prismaClient.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logAuth('User logged in', user.id, { email: user.email });

    res.status(200).json(responseFormats.success(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      },
      'Login successful'
    ));
  })
);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json(responseFormats.error('Refresh token required', 'MISSING_TOKEN'));
      return;
    }

    try {
      // Verify refresh token
      const payload = await verifyRefreshToken(refreshToken);
      
      // Check if user still exists
      const user = await prismaClient.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        res.status(401).json(responseFormats.error(
          'Invalid refresh token',
          'INVALID_TOKEN'
        ));
        return;
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json(responseFormats.success(
        { tokens },
        'Token refreshed successfully'
      ));
    } catch (error) {
      res.status(401).json(responseFormats.error(
        'Invalid refresh token',
        'INVALID_TOKEN'
      ));
    }
  })
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    // In a more complex implementation, you might want to:
    // - Invalidate the refresh token in the database
    // - Add the current access token to a blacklist
    // - Clear any server-side session data
    
    const userId = req.user?.id;
    
    if (userId) {
      logAuth('User logged out', userId);
    }

    res.status(200).json(responseFormats.success(null, 'Logout successful'));
  })
);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email',
  strictRateLimit(5, 60000), // 5 attempts per minute
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json(responseFormats.error('Verification token required', 'MISSING_TOKEN'));
      return;
    }

    // Find user by verification token
    const user = await prismaClient.user.findFirst({
      where: {
        verificationToken: token,
        isVerified: false,
      },
    });

    if (!user) {
      res.status(400).json(responseFormats.error(
        'Invalid or expired verification token',
        'INVALID_TOKEN'
      ));
      return;
    }

    // Update user as verified
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    logAuth('Email verified', user.id, { email: user.email });

    res.status(200).json(responseFormats.success(null, 'Email verified successfully'));
  })
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password',
  strictRateLimit(3, 60000), // 3 attempts per minute
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json(responseFormats.error('Email required', 'VALIDATION_ERROR'));
      return;
    }

    // Find user
    const user = await prismaClient.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json(responseFormats.success(
        null,
        'If an account exists with this email, a password reset link has been sent.'
      ));
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    // TODO: Send reset email
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Reset Your ChromaVault Password',
    //   template: 'reset-password',
    //   data: { resetToken, name: user.name },
    // });

    logAuth('Password reset requested', user.id, { email: user.email });

    res.status(200).json(responseFormats.success(
      null,
      'If an account exists with this email, a password reset link has been sent.'
    ));
  })
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  strictRateLimit(5, 60000), // 5 attempts per minute
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json(responseFormats.error('Token and password required', 'VALIDATION_ERROR'));
      return;
    }

    // Find user by reset token
    const user = await prismaClient.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json(responseFormats.error(
        'Invalid or expired reset token',
        'INVALID_TOKEN'
      ));
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    });

    logAuth('Password reset', user.id, { email: user.email });

    res.status(200).json(responseFormats.success(null, 'Password reset successfully'));
  })
);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change password for authenticated user
 * @access Private
 */
router.post('/change-password',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json(responseFormats.error('Current and new password required', 'VALIDATION_ERROR'));
      return;
    }

    const userId = req.user!.id;

    // Get user with password
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      res.status(404).json(responseFormats.error('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json(responseFormats.error(
        'Current password is incorrect',
        'INVALID_PASSWORD'
      ));
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prismaClient.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logAuth('Password changed', userId);

    res.status(200).json(responseFormats.success(null, 'Password changed successfully'));
  })
);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            palettes: true,
            favorites: true,
            collections: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json(responseFormats.error('User not found', 'USER_NOT_FOUND'));
      return;
    }

    res.status(200).json(responseFormats.success({ user }, 'User retrieved successfully'));
  })
);

export default router;