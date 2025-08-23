// shared/repositories/user.repository.ts
import { prisma } from "@/config/prisma";
import { User } from "@prisma/client";
import { getCachedUserByEmail, setCachedUser } from "@/shared/services/userCache.service";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // Primero intenta desde cache
    const cachedUser = await getCachedUserByEmail(email);
    if (cachedUser) {
      // valida con base de datos por consistencia
      return prisma.user.findUnique({ where: { id: cachedUser.id } });
    }

    // Fallback directo a DB
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await setCachedUser(user);
    }
    return user;
  }

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return prisma.user.create({ data });
  }

  async findAll(): Promise<Partial<User>[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });
  }
}
