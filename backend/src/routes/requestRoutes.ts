import { Router } from 'express';
import { pool } from '../config/db.js';
import { getIO } from '../config/socket.js';

const router = Router();

// 1. Preluare istoric mesaje
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, request_id, sender_id, message, is_ai, created_at 
      FROM request_messages 
      WHERE request_id = $1 
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Eroare GET messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Trimitere mesaj nou + Răspuns automat AI
router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { senderId, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mesajul nu poate fi gol.' });
  }

  try {
    // A. Salvează mesajul utilizatorului
    const insertQuery = `
      INSERT INTO request_messages (request_id, sender_id, message, is_ai)
      VALUES ($1, $2, $3, false)
      RETURNING id, request_id, sender_id, message, is_ai, created_at;
    `;
    const userRes = await pool.query(insertQuery, [id, senderId || null, message.trim()]);
    const userMsg = userRes.rows[0];

    // Emite mesajul utilizatorului prin Socket.io
    try {
      const io = getIO();
      io.emit(`chat_message_${id}`, userMsg);
    } catch (sErr) {
      console.warn('[Socket] Notificare mesaj eșuată:', sErr);
    }

    res.status(201).json(userMsg);

    // B. Declanșare răspuns asistent AI IncludApp
    setTimeout(async () => {
      try {
        let aiReplyText = '';
        const lower = message.toLowerCase();

        if (lower.includes('ajutor') || lower.includes('sos') || lower.includes('urgenta')) {
          aiReplyText = 'Am preluat semnalul tău. Dacă este o urgență critică, apelează serviciul 112. Voluntarii din rețeaua IncludApp din proximitate au primit notificarea de asistență.';
        } else if (lower.includes('voluntar') || lower.includes('cand vine')) {
          aiReplyText = 'Cererea ta este vizibilă pe harta voluntarilor activi. Imediat ce un voluntar acceptă misiunea, vei fi notificat și vei putea valida întâlnirea prin codul QR generat.';
        } else if (lower.includes('buna') || lower.includes('salut') || lower.includes('hei')) {
          aiReplyText = 'Salut! Sunt asistentul virtual IncludApp. Te pot ajuta cu informații despre starea cererii tale, ghidare pe hartă sau proceduri de asistență accesibilă.';
        } else {
          aiReplyText = `[IncludApp AI]: Am înregistrat solicitarea ta legată de "${message.trim()}". Un voluntar sau coordonator din zonă va prelua dialogul în cel mai scurt timp.`;
        }

        const insertAiQuery = `
          INSERT INTO request_messages (request_id, sender_id, message, is_ai)
          VALUES ($1, NULL, $2, true)
          RETURNING id, request_id, sender_id, message, is_ai, created_at;
        `;
        const aiRes = await pool.query(insertAiQuery, [id, aiReplyText]);
        const aiMsg = aiRes.rows[0];

        try {
          const io = getIO();
          io.emit(`chat_message_${id}`, aiMsg);
        } catch {}
      } catch (aiErr) {
        console.error('Eroare salvare mesaj AI:', aiErr);
      }
    }, 900);

  } catch (err: any) {
    console.error('Eroare POST messages:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;