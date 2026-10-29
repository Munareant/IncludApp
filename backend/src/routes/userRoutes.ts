import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 1. Preluare date profil și puncte
router.get('/:id/points', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT volunteer_points, rating_avg, rating_count, is_verified, avatar_url
       FROM users WHERE id = $1;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost gasit.' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Salvare poza de profil
router.patch('/:id/avatar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { avatarUrl } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET avatar_url = $1
       WHERE id = $2
       RETURNING id, full_name, avatar_url;`,
      [avatarUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost gasit.' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Verificare identitate (POST)
router.post('/:id/verify-documents', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { idCardUrl, drivingLicenseUrl } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET
         id_card_url = $1,
         driving_license_url = $2,
         is_verified = true
       WHERE id = $3
       RETURNING id, full_name, is_verified;`,
      [idCardUrl, drivingLicenseUrl || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost gasit.' });
    }

    res.json({ message: 'Identitate confirmata!', user: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Rating (POST)
router.post('/rate', async (req: Request, res: Response) => {
  const { requestId, fromUserId, toUserId, stars, comment } = req.body;

  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Rating-ul trebuie sa fie intre 1 si 5 stele' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO user_ratings (request_id, from_user_id, to_user_id, stars, review_comment)
       VALUES ($1, $2, $3, $4, $5);`,
      [requestId, fromUserId, toUserId, stars, comment || null]
    );

    const avgRes = await client.query(
      `SELECT AVG(stars)::numeric(3,2) as new_avg, COUNT(*) as new_count
       FROM user_ratings
       WHERE to_user_id = $1;`,
      [toUserId]
    );

    const { new_avg, new_count } = avgRes.rows[0];

    await client.query(
      `UPDATE users SET rating_avg = $1, rating_count = $2 WHERE id = $3;`,
      [new_avg, new_count, toUserId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Rating inregistrat cu succes!', ratingAvg: new_avg, ratingCount: new_count });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;