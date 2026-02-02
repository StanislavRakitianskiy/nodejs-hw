import createError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import handlebars from 'handlebars';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';
import { FIFTEEN_MINUTES } from '../constants/time.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError(401, 'Invalid credentials');
    }

    // Remove previous sessions for this user
    await Session.deleteMany({ userId: user._id });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies || {};

    if (!sessionId || !refreshToken) {
      throw createError(401, 'Session not found');
    }

    const session = await Session.findOne({ _id: sessionId, refreshToken });

    if (!session) {
      throw createError(401, 'Session not found');
    }

    if (session.refreshTokenValidUntil < new Date()) {
      throw createError(401, 'Session token expired');
    }

    const userId = session.userId;

    await Session.deleteOne({ _id: session._id });

    const newSession = await createSession(userId);
    setSessionCookies(res, newSession);

    res.status(200).json({
      message: 'Session refreshed'
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies || {};

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    };

    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);
    res.clearCookie('sessionId', clearOptions);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success message for security (don't reveal if user exists)
    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully'
      });
    }

    // Generate JWT token with user id and email, expires in 15 minutes
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m'
      }
    );

    // Read email template
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatePath = join(
      __dirname,
      '../templates/reset-password-email.html'
    );
    const templateSource = readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Create reset link
    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;

    // Render email with data
    const html = template({
      username: user.username || user.email,
      resetLink
    });

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset',
        html
      });
    } catch (emailError) {
      throw createError(500, 'Failed to send the email, please try again later.');
    }

    res.status(200).json({
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      throw createError(401, 'Invalid or expired token');
    }

    // Find user by sub and email from token
    const user = await User.findOne({
      _id: decoded.sub,
      email: decoded.email
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

