import { RequestHandler } from 'express';

import {
  addError,
  parseBooleanInput,
  parsePositiveInteger,
  sendValidationError,
} from './helpers';

export const validateNotificationListQuery: RequestHandler = (req, res, next) => {
  const errors: Record<string, string[]> = {};
  const parsedPage = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page);
  const parsedLimit = req.query.limit === undefined ? 10 : parsePositiveInteger(req.query.limit);
  const unreadOnlyInput = req.query.unread_only;
  const unreadOnly = unreadOnlyInput === undefined ? false : parseBooleanInput(unreadOnlyInput);

  if (parsedPage === null) {
    addError(errors, 'page', 'Page must be a positive integer');
  }

  if (parsedLimit === null || parsedLimit > 100) {
    addError(errors, 'limit', 'Limit must be between 1 and 100');
  }

  if (unreadOnlyInput !== undefined && unreadOnly === null) {
    addError(errors, 'unread_only', 'Unread only must be a boolean value');
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.notificationListQuery = {
    page: parsedPage ?? 1,
    limit: parsedLimit ?? 10,
    unreadOnly: unreadOnly ?? false,
  };

  return next();
};

export const validateNotificationIdParam: RequestHandler = (req, res, next) => {
  const errors: Record<string, string[]> = {};
  const notificationId = parsePositiveInteger(req.params.id);

  if (!notificationId) {
    addError(errors, 'id', 'Notification id must be a positive integer');
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }

  req.params.id = String(notificationId);

  return next();
};
