import { userRepository } from '../repositories/userRepository';
import { generateToken } from '../middleware/auth';
import { RegisterRequest, LoginRequest, AuthResponse } from '../../shared/types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('该邮箱已被注册');
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('该用户名已被使用');
    }

    const userId = await userRepository.create(
      data.username,
      data.email,
      data.password,
      data.avatar
    );

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('注册失败');
    }

    const token = generateToken(userId);

    return {
      id: userId,
      username: user.username,
      token,
      avatar: user.avatar
    };
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('用户不存在');
    }

    const isPasswordValid = await userRepository.verifyPassword(user, data.password);
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    const token = generateToken(user.id);

    return {
      id: user.id,
      username: user.username,
      token,
      avatar: user.avatar
    };
  },

  async getCurrentUser(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
};
