import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import type { Server } from 'http';

interface WatchlistItemResponse {
  id: number;
  symbol: string;
  companyName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('Watchlist API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as Server;
    await app.init();
  });

  beforeEach(async () => {
    await prisma.watchlistItem.deleteMany();
  });

  afterAll(async () => {
    await prisma.watchlistItem.deleteMany();
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /watchlist should create a watchlist item', async () => {
    const response = await request(httpServer)
      .post('/watchlist')
      .send({
        symbol: 'aapl',
        companyName: 'Apple Inc.',
      })
      .expect(201);

    const body = response.body as WatchlistItemResponse;

    expect(body.symbol).toBe('AAPL');
    expect(body.companyName).toBe('Apple Inc.');
    expect(body.isActive).toBe(true);
  });

  it('GET /watchlist should return created items', async () => {
    await request(httpServer).post('/watchlist').send({
      symbol: 'aapl',
      companyName: 'Apple Inc.',
    });

    await request(httpServer).post('/watchlist').send({
      symbol: 'msft',
      companyName: 'Microsoft Corp.',
    });

    const response = await request(httpServer).get('/watchlist').expect(200);

    const body = response.body as WatchlistItemResponse[];

    expect(body).toHaveLength(2);
    expect(body[0].symbol).toBe('MSFT');
    expect(body[1].symbol).toBe('AAPL');
  });

  it('DELETE /watchlist/:symbol should delete an existing item', async () => {
    await request(httpServer).post('/watchlist').send({
      symbol: 'snap',
      companyName: 'Snap Inc.',
    });

    const deleteResponse = await request(httpServer)
      .delete('/watchlist/snap')
      .expect(200);

    const deleteResponseBody = deleteResponse.body as WatchlistItemResponse;
    expect(deleteResponseBody.symbol).toBe('SNAP');

    const listResponse = await request(httpServer)
      .get('/watchlist')
      .expect(200);

    const listResponseBody = listResponse.body as WatchlistItemResponse[];
    expect(listResponseBody).toHaveLength(0);
  });

  it('DELETE /watchlist/:symbol should return 404 for missing item', async () => {
    const response = await request(httpServer)
      .delete('/watchlist/pltr')
      .expect(404);

    const body = response.body as ErrorResponse;

    expect(body.statusCode).toBe(404);
    expect(body.error).toBe('Not Found');
  });
});
