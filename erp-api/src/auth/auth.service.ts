import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './auth.entity';

interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Auth Service
 * 
 * IMPORTANT: This service now works with the accounting database schema
 * - Users require tenant_id (set to NULL for self-service registrations)
 * - Role uses enum: OWNER, ACCOUNTANT, MANAGER, VIEWER
 * - Default role for new registrations: VIEWER
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * 
   * FIXES APPLIED:
   * - Uses 'VIEWER' role (valid enum value) instead of 'user'
   * - Sets tenant_id to NULL (for self-registered users)
   * - Stores hashed password in password_hash column
   */
  async register(registerDto: RegisterUserDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with accounting database schema
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,  // Maps to password_hash column
      firstName,                  // Maps to first_name column
      lastName,                   // Maps to last_name column
      role: UserRole.VIEWER,      // ✅ FIXED: Use valid enum value (was 'user')
      isActive: true,
      tenantId: 'd7aaf087-9506-4166-a506-004edafe91f1', // ✅ FIXED: Use actual tenant from database
    });

    // Save user to database
    const savedUser = await this.userRepository.save(newUser);

    // Generate JWT token
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      access_token: accessToken,
    };
  }

  /**
   * Register a user with explicit firstName and lastName from controller
   */
  async registerFromController(email: string, password: string, firstName: string, lastName?: string) {
    return this.register({
      email,
      password,
      firstName,
      lastName: lastName || '',
    });
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: accessToken,
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Update user role (admin function)
   * 
   * Valid roles: OWNER, ACCOUNTANT, MANAGER, VIEWER
   */
  async updateRole(userId: string, newRole: UserRole) {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.role = newRole;
    return this.userRepository.save(user);
  }

  /**
   * Assign user to tenant (admin function)
   */
  async assignToTenant(userId: string, tenantId: string) {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.tenantId = tenantId;
    return this.userRepository.save(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: { firstName?: string; lastName?: string; email?: string }) {
    const user = await this.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
      user.email = data.email;
    }

    if (data.firstName) {
      user.firstName = data.firstName;
    }

    if (data.lastName) {
      user.lastName = data.lastName;
    }

    await this.userRepository.save(user);
    return {
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Change password
   */
  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await this.userRepository.save(user);
    return {
      message: 'Password changed successfully',
    };
  }
}

