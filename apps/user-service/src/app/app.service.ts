import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Ward } from './entities/ward.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>
  ) {}

  async registerCitizen(data: any): Promise<User> {
    const { email, password, name, phone, wardNumber, unitNumber, address, voterId, photo, latitude, longitude } = data;

    if (!email || !password || !name) {
      throw new BadRequestException('Email, password, and name are required.');
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered.');
    }

    // Verify ward exists
    if (wardNumber) {
      const ward = await this.wardRepository.findOne({ where: { id: wardNumber } });
      if (!ward) {
        throw new BadRequestException(`Ward ${wardNumber} does not exist.`);
      }
    }

    // Voter ID validation if provided
    let cleanVoterId: string | undefined = undefined;
    if (voterId) {
      cleanVoterId = voterId.trim().toUpperCase();
      const epicRegex = /^[A-Z]{3}[0-9]{7}$/;
      if (!epicRegex.test(cleanVoterId)) {
        throw new BadRequestException('Invalid Voter ID format. Expected standard EPIC card format: 3 letters followed by 7 digits (e.g., ABC1234567).');
      }

      // Check if voter ID is already in use
      const voterIdCheck = await this.userRepository.findOne({ where: { voterId: cleanVoterId } });
      if (voterIdCheck) {
        throw new BadRequestException('This Voter ID is already registered.');
      }
    }

    const user = this.userRepository.create({
      email,
      password, // Plain text for simplicity in MVP demo
      name,
      phone,
      wardNumber,
      unitNumber,
      address,
      voterId: cleanVoterId,
      photo,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      role: UserRole.CITIZEN,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async createAdminUser(data: any): Promise<User> {
    const { email, password, name, role, phone, wardNumber, address } = data;

    if (!email || !password || !name || !role) {
      throw new BadRequestException('Email, password, name, and role are required.');
    }

    // Verify valid administrative roles
    const validRoles = [UserRole.NAGARSEVAK, UserRole.CHIEF_OFFICER, UserRole.WORKER, UserRole.COLLECTOR];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}. Admins can only register municipal administrative roles.`);
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered.');
    }

    // Verify ward exists (especially important for Nagarsevaks)
    if (role === UserRole.NAGARSEVAK && !wardNumber) {
      throw new BadRequestException('Ward selection is mandatory for registering a Nagarsevak.');
    }

    if (wardNumber) {
      const ward = await this.wardRepository.findOne({ where: { id: wardNumber } });
      if (!ward) {
        throw new BadRequestException(`Ward ${wardNumber} does not exist.`);
      }
    }

    const user = this.userRepository.create({
      email,
      password, // Plain text for simplicity in MVP demo
      name,
      phone,
      wardNumber: role === UserRole.NAGARSEVAK ? wardNumber : undefined,
      address,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async login(data: any): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const { email, password } = data;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    // Simple mock JWT token for the demo
    const mockToken = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64');

    return {
      token: `mock-jwt-token.${mockToken}`,
      user: userWithoutPassword,
    };
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    delete user.password;
    return user;
  }

  async getUsers(role?: UserRole, wardNumber?: number): Promise<Omit<User, 'password'>[]> {
    const query: any = {};
    if (role) query.role = role;
    if (wardNumber) query.wardNumber = wardNumber;

    const users = await this.userRepository.find({ where: query });
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  async getWards(): Promise<Ward[]> {
    return this.wardRepository.find({ order: { id: 'ASC' } });
  }

  async getWardById(id: number): Promise<Ward> {
    const ward = await this.wardRepository.findOne({ where: { id } });
    if (!ward) {
      throw new NotFoundException('Ward not found.');
    }
    return ward;
  }

  async rateNagarsevak(id: string, rating: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id, role: UserRole.NAGARSEVAK } });
    if (!user) {
      throw new NotFoundException('Nagarsevak not found.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    // Blend the new rating into a simple average model
    user.rating = +( (user.rating * 4 + rating) / 5 ).toFixed(1);
    await this.userRepository.save(user);

    delete user.password;
    return user;
  }
}
