import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 12;

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400, 'VALIDATION_ERROR');
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with default settings
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        settings: {
          create: {
            theme: 'dark',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  // JWT is stateless, so logout is handled client-side by removing the token
  // This endpoint exists for consistency and can be used for token blacklisting if needed
  res.json({ message: 'Logged out successfully' });
}
