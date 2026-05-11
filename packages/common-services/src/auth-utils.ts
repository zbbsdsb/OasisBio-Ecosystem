import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthError } from './types';

export interface AuthService {
  getServerUser(): Promise<SupabaseUser | null>;
}

export interface OwnershipChecker {
  oasisBio: {
    findUnique: (args: { where: { id: string }; select: { id: true; userId: true } }) => Promise<{ id: string; userId: string } | null>;
  };
  dcosFile: {
    findUnique: (args: { where: { id: string }; include: { oasisBio: { select: { userId: true } } } }) => Promise<{ oasisBio: { userId: string } } | null>;
  };
  ability: {
    findUnique: (args: { where: { id: string }; include: { oasisBio: { select: { userId: true } } } }) => Promise<{ oasisBio: { userId: string } } | null>;
  };
  worldItem: {
    findUnique: (args: { where: { id: string }; include: { oasisBio: { select: { userId: true } } } }) => Promise<{ oasisBio: { userId: string } } | null>;
  };
  referenceItem: {
    findUnique: (args: { where: { id: string }; include: { oasisBio: { select: { userId: true } } } }) => Promise<{ oasisBio: { userId: string } } | null>;
  };
  worldDocument: {
    findUnique: (args: { where: { id: string }; include: { world: { include: { oasisBio: { select: { userId: true } } } } } }) => Promise<{ world: { oasisBio: { userId: string } } } | null>;
  };
}

export class AuthUtils {
  constructor(
    private authService: AuthService,
    private prisma: OwnershipChecker
  ) {}

  async requireAuth(): Promise<SupabaseUser> {
    const user = await this.authService.getServerUser();

    if (!user) {
      throw new AuthError('Unauthorized', 401);
    }

    return user;
  }

  async requireOasisBioOwnership(oasisBioId: string, userId: string) {
    const oasisBio = await this.prisma.oasisBio.findUnique({
      where: { id: oasisBioId },
      select: { id: true, userId: true },
    });

    if (!oasisBio) throw new AuthError('OasisBio not found', 404);
    if (oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return oasisBio;
  }

  async requireDcosFileOwnership(dcosFileId: string, userId: string) {
    const dcosFile = await this.prisma.dcosFile.findUnique({
      where: { id: dcosFileId },
      include: { oasisBio: { select: { userId: true } } },
    });

    if (!dcosFile) throw new AuthError('DCOS file not found', 404);
    if (dcosFile.oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return dcosFile;
  }

  async requireAbilityOwnership(abilityId: string, userId: string) {
    const ability = await this.prisma.ability.findUnique({
      where: { id: abilityId },
      include: { oasisBio: { select: { userId: true } } },
    });

    if (!ability) throw new AuthError('Ability not found', 404);
    if (ability.oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return ability;
  }

  async requireWorldOwnership(worldId: string, userId: string) {
    const world = await this.prisma.worldItem.findUnique({
      where: { id: worldId },
      include: { oasisBio: { select: { userId: true } } },
    });

    if (!world) throw new AuthError('World not found', 404);
    if (world.oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return world;
  }

  async requireReferenceOwnership(referenceId: string, userId: string) {
    const reference = await this.prisma.referenceItem.findUnique({
      where: { id: referenceId },
      include: { oasisBio: { select: { userId: true } } },
    });

    if (!reference) throw new AuthError('Reference item not found', 404);
    if (reference.oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return reference;
  }

  async requireWorldDocumentOwnership(documentId: string, userId: string) {
    const document = await this.prisma.worldDocument.findUnique({
      where: { id: documentId },
      include: { world: { include: { oasisBio: { select: { userId: true } } } } },
    });

    if (!document) throw new AuthError('World document not found', 404);
    if (document.world.oasisBio.userId !== userId) throw new AuthError('Forbidden', 403);

    return document;
  }

  handleApiError(error: unknown): { error: { code: string; message: string }; status: number } {
    console.error('[api] Error:', error);

    if (error instanceof AuthError) {
      return {
        error: { code: error.code, message: error.message },
        status: error.statusCode
      };
    }

    return {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      status: 500
    };
  }
}
