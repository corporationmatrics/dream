import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Role Enum
 * Matches database enum: role_enum
 * Valid values: OWNER, ACCOUNTANT, MANAGER, VIEWER
 */
export enum UserRole {
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

/**
 * User Entity
 * 
 * Maps to 'users' table in the accounting database schema
 * 
 * Key mappings:
 * - id (entity) → user_id (database)
 * - firstName (entity) → first_name (database)
 * - lastName (entity) → last_name (database)
 * - password (entity) → password_hash (database)
 * - tenantId (entity) → tenant_id (database)
 * - role (entity) → role (database, enum type)
 * - isActive (entity) → is_active (database)
 * - createdAt (entity) → created_at (database)
 * - updatedAt (entity) → updated_at (database)
 */
@Entity('users')
@Index('idx_users_email', ['email'])
export class User {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId!: string | null;

  @Column({ unique: false })
  email!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name', nullable: true })
  lastName!: string;

  @Column({ name: 'password_hash' })
  password!: string;

  /**
   * Role column
   * Database uses enum type: role_enum {OWNER, ACCOUNTANT, MANAGER, VIEWER}
   * TypeORM enum: UserRole
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /**
   * Virtual property: Full name
   * Not stored in database, computed from firstName + lastName
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Virtual property: Role display name
   */
  get roleDisplayName(): string {
    const roleNames: Record<UserRole, string> = {
      [UserRole.OWNER]: 'Owner',
      [UserRole.ACCOUNTANT]: 'Accountant',
      [UserRole.MANAGER]: 'Manager',
      [UserRole.VIEWER]: 'Viewer',
    };
    return roleNames[this.role] || this.role;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if user is an owner
   */
  isOwner(): boolean {
    return this.role === UserRole.OWNER;
  }

  /**
   * Check if user can manage accounting (Owner or Accountant)
   */
  canManageAccounting(): boolean {
    return this.role === UserRole.OWNER || this.role === UserRole.ACCOUNTANT;
  }

  /**
   * Check if user has management privileges (Owner, Accountant, or Manager)
   */
  canManage(): boolean {
    return [UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.MANAGER].includes(this.role);
  }
}
