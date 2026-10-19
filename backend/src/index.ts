import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import { initSocket } from './config/socket.js';
import requestRoutes from './routes/requestRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initializam Socket.io atasat la serverul HTTP
initSocket(server);

app.use(cors());
app.use(express.json());

// Rute aplicatie
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);

// Endpoint Health Check
app.get('/api/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'online',
      message: 'IncludApp API este functional!',
      database_time: result.rows[0].current_time,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Pornim serverul HTTP
server.listen(port, () => {
  console.log(`Serverul IncludApp ruleaza la adresa: http://localhost:${port}`);
});