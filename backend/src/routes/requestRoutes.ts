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

// 2. Trimitere mesaj nou + Răspuns AI doar la solicitare expresă
router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { senderId, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mesajul nu poate fi gol.' });
  }

  try {
    const trimmed = message.trim();

    // A. Salvare mesaj utilizator
    const insertQuery = `
      INSERT INTO request_messages (request_id, sender_id, message, is_ai)
      VALUES ($1, $2, $3, false)
      RETURNING id, request_id, sender_id, message, is_ai, created_at;
    `;
    const userRes = await pool.query(insertQuery, [id, senderId || null, trimmed]);
    const userMsg = userRes.rows[0];

    // B. Notificare prin Socket.io
    try {
      const io = getIO();
      io.emit(`chat_message_${id}`, userMsg);
    } catch (sErr) {
      console.warn('[Socket] Emit eșuat:', sErr);
    }

    res.status(201).json(userMsg);

    // C. Verificăm istoricul AI pentru a nu saluta de două ori
    const aiCountQuery = `
      SELECT COUNT(*) FROM request_messages 
      WHERE request_id = $1 AND is_ai = true;
    `;
    const aiCountRes = await pool.query(aiCountQuery, [id]);
    const aiMessagesCount = parseInt(aiCountRes.rows[0].count, 10);

    const lower = trimmed.toLowerCase();
    const isEmergency = lower.includes('sos') || lower.includes('urgenta');
    const isAssistantRequested = lower.includes('am nevoie de asistent') || lower.includes('ajutor asistent');
    const isInitialGreeting = (lower === 'salut' || lower === 'buna' || lower === 'hei' || lower === 'hello') && aiMessagesCount === 0;

    let aiReplyText = '';

    if (isEmergency) {
      aiReplyText = 'Am detectat o urgență. Pentru situații critice de viață sau sănătate, apelează imediat serviciul 112. Semnalul tău a fost prioritizat în rețeaua IncludApp.';
    } else if (isAssistantRequested) {
      aiReplyText = 'Sunt asistentul IncludApp. Te ascult: cum te pot sprijini cu această misiune (informații locație, validare QR sau detalii de accesibilitate)?';
    } else if (isInitialGreeting) {
      aiReplyText = 'Salut! Sunt asistentul virtual IncludApp. Dacă ai nevoie de sprijin sau îndrumare pe parcursul misiunii, scrie oricând "am nevoie de asistent".';
    }

    // Trimitem răspuns DOAR dacă s-a potrivit una dintre cele trei condiții de mai sus
    if (aiReplyText) {
      setTimeout(async () => {
        try {
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
      }, 700);
    }
  } catch (err: any) {
    console.error('Eroare POST messages:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;