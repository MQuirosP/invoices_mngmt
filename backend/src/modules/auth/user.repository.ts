import { prisma } from "@/config/prisma";
import { User } from "@prisma/client";
import { getCachedUserByEmail, setCachedUser } from "@/shared/services/userCache.service";

export const UserRepository = {
  findByEmail: async (email: string): Promise<User | null> => {
    const cachedUser = await getCachedUserByEmail(email);
    if (cachedUser) {
      return prisma.user.findUnique({ where: { id: cachedUser.id } });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await setCachedUser(user);
    }
    return user;
  },

  createUser: async (
    data: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> => {
    return prisma.user.create({ data });
  },

  findAll: async (): Promise<Partial<User>[]> => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });
  },
};