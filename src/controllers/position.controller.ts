import { RequestHandler } from 'express';

import { positionService } from '../services/position.service';
import { sendSuccess } from '../utils/response';

export const getPositions: RequestHandler = async (_req, res) => {
  const positions = await positionService.getPositions();

  return sendSuccess(res, {
    message: 'Positions fetched successfully',
    data: positions,
  });
};

export const getPositionById: RequestHandler = async (req, res) => {
  const position = await positionService.getPositionById(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Position fetched successfully',
    data: position,
  });
};

export const createPosition: RequestHandler = async (req, res) => {
  const position = await positionService.createPosition(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Position created successfully',
    data: position,
  });
};

export const updatePosition: RequestHandler = async (req, res) => {
  const position = await positionService.updatePosition(Number(req.params.id), req.body);

  return sendSuccess(res, {
    message: 'Position updated successfully',
    data: position,
  });
};

export const deletePosition: RequestHandler = async (req, res) => {
  await positionService.deletePosition(Number(req.params.id));

  return sendSuccess(res, {
    message: 'Position deleted successfully',
    data: null,
  });
};
