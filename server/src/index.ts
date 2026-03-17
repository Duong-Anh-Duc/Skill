import app from './app';
import { config } from './config';
import prisma from './config/database';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server running on port ${config.port} (HTTP)`);
      console.log(`API: http://localhost:${config.port}/api`);
      console.log(`UI:  http://localhost:${config.port}`);
      console.log(`Health: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
