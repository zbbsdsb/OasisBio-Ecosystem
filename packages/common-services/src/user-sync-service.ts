import type { SyncResult } from './types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface PrismaClient {
  user: {
    upsert: (args: {
      where: { id: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<{ id: string; email: string; name: string }>;
    findUnique: (args: { where: { id: string }; select?: Record<string, boolean> }) => Promise<{ name?: string } | null>;
  };
  profile: {
    findUnique: (args: { where: { username: string } }) => Promise<{ id: string; username: string; displayName?: string; avatarUrl?: string } | null>;
    findFirst: (args: { where: { userId: string } }) => Promise<{ id: string; username: string; displayName?: string; avatarUrl?: string } | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<{ id: string; username: string }>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; username: string }>;
  };
}

export class UserSyncService {
  constructor(private prisma: PrismaClient) {}

  async generateUniqueUsername(base: string): Promise<string> {
    const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    const stem = clean.length > 0 ? clean : `user_${crypto.randomBytes(3).toString('hex')}`;

    let candidate = stem;
    let counter = 0;
    const maxAttempts = 100;

    while (counter < maxAttempts) {
      const existing = await this.prisma.profile.findUnique({ where: { username: candidate } });
      if (!existing) return candidate;

      counter++;
      candidate = `${stem}${counter}`;
    }

    throw new Error(`Failed to generate unique username for base "${base}" after ${maxAttempts} attempts`);
  }

  async syncUserToPrisma(supabaseUser: SupabaseUser): Promise<SyncResult> {
    const { id, email, user_metadata } = supabaseUser;
    const displayName: string =
      user_metadata?.display_name ||
      user_metadata?.name ||
      email?.split('@')[0] ||
      'User';

    const user = await this.prisma.user.upsert({
      where: { id },
      update: {
        email: email ?? '',
        ...(await this.shouldUpdateName(id, displayName) ? { name: displayName } : {}),
      },
      create: {
        id,
        email: email ?? '',
        name: displayName,
      },
    });

    const existingProfile = await this.prisma.profile.findFirst({ where: { userId: id } });

    if (existingProfile) {
      const updates: Record<string, string> = {};
      if (!existingProfile.displayName) updates.displayName = displayName;
      if (!existingProfile.avatarUrl && user_metadata?.avatar_url) {
        updates.avatarUrl = user_metadata.avatar_url;
      }

      const profile =
        Object.keys(updates).length > 0
          ? await this.prisma.profile.update({ where: { id: existingProfile.id }, data: updates })
          : existingProfile;

      return {
        userId: user.id,
        profileId: profile.id,
        username: profile.username,
        isNewUser: false,
      };
    }

    let profile;
    let username = await this.generateUniqueUsername(displayName);
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        profile = await this.prisma.profile.create({
          data: {
            userId: id,
            username,
            displayName,
            avatarUrl: user_metadata?.avatar_url ?? null,
          },
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('username')) {
          retries++;
          if (retries >= maxRetries) throw err;
          username = await this.generateUniqueUsername(
            displayName + '_' + crypto.randomBytes(2).toString('hex')
          );
          continue;
        }
        throw err;
      }
    }

    return {
      userId: user.id,
      profileId: profile!.id,
      username: profile!.username,
      isNewUser: true,
    };
  }

  private async shouldUpdateName(userId: string, newName: string): Promise<boolean> {
    if (!newName) return false;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    return !user?.name;
  }
}
