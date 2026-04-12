import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from '../config/db';
import {
  CreateNotificationPayload,
  NotificationEntity,
  NotificationListQuery,
} from '../types/notification';

interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  actor_user_id: number | null;
  actor_name: string | null;
  leave_request_id: number | null;
  type: 'leave_submitted' | 'leave_approved' | 'leave_rejected';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const notificationSelect = `
  SELECT
    n.id,
    n.user_id,
    n.actor_user_id,
    actor.full_name AS actor_name,
    n.leave_request_id,
    n.type,
    n.title,
    n.message,
    CASE
      WHEN n.read_at IS NULL THEN NULL
      ELSE DATE_FORMAT(n.read_at, '%Y-%m-%d %H:%i:%s')
    END AS read_at,
    DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
  FROM notifications n
  LEFT JOIN users actor ON actor.id = n.actor_user_id
`;

const mapNotification = (row: NotificationRow): NotificationEntity => {
  return {
    id: row.id,
    userId: row.user_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    leaveRequestId: row.leave_request_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.read_at !== null,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
};

const buildNotificationFilters = (
  userId: number,
  query: NotificationListQuery,
): { whereSql: string; values: Array<number | string> } => {
  const conditions = ['n.user_id = ?'];
  const values: Array<number | string> = [userId];

  if (query.unreadOnly) {
    conditions.push('n.read_at IS NULL');
  }

  return {
    whereSql: `WHERE ${conditions.join(' AND ')}`,
    values,
  };
};

export const notificationRepository = {
  async createMany(payloads: CreateNotificationPayload[]): Promise<void> {
    if (payloads.length === 0) {
      return;
    }

    await Promise.all(
      payloads.map((payload) =>
        db.execute<ResultSetHeader>(
          `
            INSERT INTO notifications (
              user_id,
              actor_user_id,
              leave_request_id,
              type,
              title,
              message
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            payload.userId,
            payload.actorUserId,
            payload.leaveRequestId,
            payload.type,
            payload.title,
            payload.message,
          ],
        ),
      ),
    );
  },

  async findAllByUserId(
    userId: number,
    query: NotificationListQuery,
  ): Promise<{ items: NotificationEntity[]; total: number; unreadCount: number }> {
    const { whereSql, values } = buildNotificationFilters(userId, query);
    const offset = (query.page - 1) * query.limit;

    const [rows] = await db.query<NotificationRow[]>(
      `
        ${notificationSelect}
        ${whereSql}
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT ? OFFSET ?
      `,
      [...values, query.limit, offset],
    );

    const [countRows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(n.id) AS total
        FROM notifications n
        ${whereSql}
      `,
      values,
    );

    const [unreadRows] = await db.execute<CountRow[]>(
      `
        SELECT COUNT(n.id) AS total
        FROM notifications n
        WHERE n.user_id = ? AND n.read_at IS NULL
      `,
      [userId],
    );

    return {
      items: rows.map(mapNotification),
      total: countRows[0]?.total ?? 0,
      unreadCount: unreadRows[0]?.total ?? 0,
    };
  },

  async findByIdForUser(id: number, userId: number): Promise<NotificationEntity | null> {
    const [rows] = await db.execute<NotificationRow[]>(
      `
        ${notificationSelect}
        WHERE n.id = ? AND n.user_id = ?
        LIMIT 1
      `,
      [id, userId],
    );

    const notification = rows[0];

    return notification ? mapNotification(notification) : null;
  },

  async markAsRead(id: number, userId: number, readAt: Date): Promise<boolean> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at, ?)
        WHERE id = ? AND user_id = ?
      `,
      [readAt, id, userId],
    );

    return result.affectedRows > 0;
  },

  async markAllAsRead(userId: number, readAt: Date): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
        UPDATE notifications
        SET read_at = ?
        WHERE user_id = ? AND read_at IS NULL
      `,
      [readAt, userId],
    );

    return result.affectedRows;
  },
};
