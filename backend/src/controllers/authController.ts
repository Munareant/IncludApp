import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, phone, role, disabilityType } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({ message: 'Campurile obligatorii lipsesc: fullName, email, password, role.' });
      return;
    }

    const normalizedRole = role.toUpperCase();
    if (!['BENEFICIARY', 'VOLUNTEER', 'ADMIN'].includes(normalizedRole)) {
      res.status(400).json({ message: 'Rol invalid. Poate fi BENEFICIARY, VOLUNTEER sau ADMIN.' });
      return;
    }

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExists.rows.length > 0) {
      res.status(409).json({ message: 'Exista deja un cont inregistrat cu acest email.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (full_name, email, password_hash, phone, role, disability_type, volunteer_points)
      VALUES ($1, $2, $3, $4, $5, $6, 0)
      RETURNING id, full_name, email, role, phone, volunteer_points, created_at;
    `;
    const values = [fullName.trim(), email.toLowerCase().trim(), passwordHash, phone || null, normalizedRole, disabilityType || null];
    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Cont creat cu succes!',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ message: 'Eroare la crearea contului.', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Te rugam sa introduci email si parola.' });
      return;
    }

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, phone, volunteer_points FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Email sau parola incorecta.' });
      return;
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      res.status(401).json({ message: 'Contul nu are parola setata. Te rugam sa te inregistrezi din nou.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'Email sau parola incorecta.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Autentificare reusita!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        volunteerPoints: user.volunteer_points,
      },
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ message: 'Eroare la autentificare.', error: error.message });
  }
};