import { pool } from '../config/db.js';
import { getIO } from '../config/socket.js';

export interface CreateRequestDTO {
  beneficiaryId: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  disabilityType?: 'VISUAL' | 'DEAF_MUTE' | 'LOCOMOTOR' | 'GENERAL';
}

export class RequestService {
  // 1. Un voluntar preia cererea
  static async assignVolunteer(requestId: string, volunteerId: string) {
    const query = `
      UPDATE assistance_requests
      SET 
        volunteer_id = $1,
        status = 'ASSIGNED'
      WHERE id = $2 AND status = 'OPEN'
      RETURNING id, beneficiary_id, volunteer_id, status, qr_validation_code;
    `;
    const result = await pool.query(query, [volunteerId, requestId]);
    if (result.rows.length === 0) {
      throw new Error('Cererea nu exista sau a fost deja preluata.');
    }
    return result.rows[0];
  }

  // 2. Voluntarul scaneaza codul QR pentru validare si primeste 50 de puncte
  static async completeWithQR(requestId: string, qrCode: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const checkQuery = `
        SELECT id, volunteer_id, status, qr_validation_code 
        FROM assistance_requests 
        WHERE id = $1 FOR UPDATE;
      `;
      const resCheck = await client.query(checkQuery, [requestId]);

      if (resCheck.rows.length === 0) {
        throw new Error('Cererea nu a fost gasita.');
      }

      const req = resCheck.rows[0];
      if (req.status !== 'ASSIGNED') {
        throw new Error('Cererea nu este in starea ASSIGNED.');
      }
      if (req.qr_validation_code !== qrCode) {
        throw new Error('Codul QR este invalid.');
      }

      // Marcare ca finalizata
      const updateReqQuery = `
        UPDATE assistance_requests 
        SET status = 'COMPLETED', completed_at = NOW() 
        WHERE id = $1 
        RETURNING *;
      `;
      const completedReq = await client.query(updateReqQuery, [requestId]);

      // Alocare 50 puncte voluntarului
      if (req.volunteer_id) {
        await client.query(
          `UPDATE users SET volunteer_points = volunteer_points + 50 WHERE id = $1;`,
          [req.volunteer_id]
        );
      }

      await client.query('COMMIT');
      return completedReq.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 3. Creare cerere SOS + conversie coordonate PostGIS + notificare Socket.io
  static async createRequest(data: CreateRequestDTO) {
    const query = `
      INSERT INTO assistance_requests (
        beneficiary_id,
        title,
        description,
        location,
        qr_validation_code
        disability_type
      )
      VALUES (
        $1,
        $2,
        $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
        md5(random()::text),
        $6
      )
      RETURNING 
        id,
        beneficiary_id,
        title,
        description,
        status,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        qr_validation_code,
        created_at;
    `;

    const values = [
      data.beneficiaryId,
      data.title,
      data.description || null,
      data.longitude, // $4: X = Longitudine
      data.latitude,  // $5: Y = Latitudine
      data.disabilityType || 'GENERAL',
    ];

    const result = await pool.query(query, values);
    const newRequest = result.rows[0];

    // Emite alerta SOS prin Socket.io catre voluntari
    try {
      const io = getIO();
      io.to('volunteers_room').emit('new_sos_alert', {
        id: newRequest.id,
        title: newRequest.title,
        description: newRequest.description,
        latitude: newRequest.latitude,
        longitude: newRequest.longitude,
        createdAt: newRequest.created_at,
      });
      console.log(`[Socket.io] Alerta SOS emisa pentru cererea ${newRequest.id}`);
    } catch (socketErr) {
      console.warn('[Socket.io] Avertisment: Nu s-a putut trimite alerta prin socket:', socketErr);
    }

    return newRequest;
  }

  // 4. Interogare cereri active in raza specificata (PostGIS)
  static async getNearbyRequests(latitude: number, longitude: number, radiusMeters: number = 5000) {
    const query = `
      SELECT
        id,
        beneficiary_id,
        title,
        description,
        status,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) AS distance_meters,
        created_at
      FROM assistance_requests
      WHERE
        status = 'OPEN'
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      ORDER BY distance_meters ASC;
    `;

    const values = [longitude, latitude, radiusMeters];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // 5. Preluare istoric mesaje pentru o cerere
  static async getMessagesByRequestId(requestId: string) {
    const query = `
      SELECT id, request_id, sender_id, message, created_at 
      FROM request_messages 
      WHERE request_id = $1 
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query, [requestId]);
    return result.rows;
  }

  // 6. Preluare istoric cereri pentru un utilizator
  static async getUserRequestsHistory(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.created_at,
        r.completed_at,
        b.full_name as beneficiary_name,
        v.full_name as volunteer_name
      FROM assistance_requests r
      LEFT JOIN users b ON r.beneficiary_id = b.id
      LEFT JOIN users v ON r.volunteer_id = v.id
      WHERE r.beneficiary_id = $1 OR r.volunteer_id = $1
      ORDER BY r.created_at DESC
      LIMIT 20;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}