import { Request, Response } from 'express';
import { RequestService } from '../services/requestService.js';

export class RequestController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { beneficiaryId, title, description, latitude, longitude } = req.body;

      if (!beneficiaryId || !title || latitude === undefined || longitude === undefined) {
        res.status(400).json({
          error: 'Campurile beneficiaryId, title, latitude si longitude sunt obligatorii.',
        });
        return;
      }

      const newRequest = await RequestService.createRequest({
        beneficiaryId,
        title,
        description,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      res.status(201).json(newRequest);
    } catch (error: any) {
      console.error('Eroare creare cerere:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getNearby(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          error: 'Parametrii lat si lng sunt obligatorii.',
        });
        return;
      }

      const radiusMeters = radius ? Number(radius) : 500;
      const requests = await RequestService.getNearbyRequests(
        Number(lat),
        Number(lng),
        radiusMeters
      );

      res.json({
        count: requests.length,
        radius_meters: radiusMeters,
        data: requests,
      });
    } catch (error: any) {
      console.error('Eroare cautare cereri apropiate:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async assign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { volunteerId } = req.body;

      if (!volunteerId) {
        res.status(400).json({ error: 'Campul volunteerId este obligatoriu.' });
        return;
      }

      const updated = await RequestService.assignVolunteer(id as string, volunteerId);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async complete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { qrCode } = req.body;

      if (!qrCode) {
        res.status(400).json({ error: 'Campul qrCode este obligatoriu.' });
        return;
      }

      const completed = await RequestService.completeWithQR(id as string, qrCode);
      res.json({ message: 'Cerere finalizata cu succes! +50 puncte adaugate.', data: completed });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}