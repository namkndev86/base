export class UserEntity {
  constructor(
    public readonly id: string,
    private email: string,
    public readonly tenantId: string | null,
    private isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(email: string, tenantId: string | null = null, id?: string): UserEntity {
    const now = new Date();
    return new UserEntity(
      id || '', // repo generates UUID
      email,
      tenantId,
      true,
      now,
      now,
    );
  }

  getEmail(): string {
    return this.email;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  changeEmail(newEmail: string) {
    if (!newEmail || !newEmail.includes('@')) {
      throw new Error('Invalid email address format');
    }
    this.email = newEmail;
  }

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }
}
