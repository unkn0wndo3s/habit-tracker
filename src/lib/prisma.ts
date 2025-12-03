import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const logOptions: Array<'query' | 'error' | 'warn'> = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn']
  : ['error'];

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Créer le pool une seule fois et le réutiliser
  if (!globalForPrisma.pool) {
    const isCloudDb = connectionString.includes('render.com') || 
                      connectionString.includes('amazonaws.com') ||
                      connectionString.includes('railway.app') ||
                      connectionString.includes('supabase.co');

    globalForPrisma.pool = new Pool({ 
      connectionString,
      max: 5,
      min: 1, // Maintenir au moins une connexion active
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      // Options SSL pour les bases de données cloud
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    });

    // Gérer les erreurs du pool
    globalForPrisma.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Tester la connexion au démarrage
    globalForPrisma.pool.query('SELECT 1')
      .then(() => {
        console.log('✅ Pool de connexions Prisma initialisé');
      })
      .catch((err) => {
        console.error('❌ Erreur lors de l\'initialisation du pool:', err);
      });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: logOptions,
  });
}

export const prisma =
  globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

