import { getDb } from './connection';
import { logger } from '../logger';

export const ACHIEVEMENTS = [
  {
    id: 'first-query',
    title: 'First Query',
    description: 'Complete your first task',
    icon: 'Play',
    conditionType: 'tasks_completed',
    conditionValue: 1,
  },
  {
    id: 'beginner-done',
    title: 'SQL Basics',
    description: 'Complete all Beginner level tasks',
    icon: 'Award',
    conditionType: 'difficulty_completed',
    conditionValue: 8,
  },
  {
    id: 'intermediate-done',
    title: 'Advanced Queries',
    description: 'Complete all Intermediate level tasks',
    icon: 'Star',
    conditionType: 'difficulty_completed',
    conditionValue: 23,
  },
  {
    id: 'advanced-done',
    title: 'SQL Master',
    description: 'Complete all Advanced level tasks',
    icon: 'Crown',
    conditionType: 'difficulty_completed',
    conditionValue: 25,
  },
  {
    id: 'all-complete',
    title: 'All Tasks',
    description: 'Complete all 56 tasks',
    icon: 'Trophy',
    conditionType: 'tasks_completed',
    conditionValue: 56,
  },
  {
    id: 'speed-demon',
    title: 'Quick Mind',
    description: 'Complete a task on the first attempt',
    icon: 'Zap',
    conditionType: 'single_attempt',
    conditionValue: 1,
  },
  {
    id: 'persistent',
    title: 'Persistent',
    description: 'Complete 10 tasks',
    icon: 'Flame',
    conditionType: 'tasks_completed',
    conditionValue: 10,
  },
  {
    id: 'streak-3',
    title: 'Streak 3',
    description: 'Complete 3 tasks in a row on first attempt',
    icon: 'Target',
    conditionType: 'streak_perfect',
    conditionValue: 3,
  },
  {
    id: 'streak-5',
    title: 'Streak 5',
    description: 'Complete 5 tasks in a row on first attempt',
    icon: 'Shield',
    conditionType: 'streak_perfect',
    conditionValue: 5,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Try both SQLite and PostgreSQL',
    icon: 'Compass',
    conditionType: 'db_types_used',
    conditionValue: 2,
  },
];

function seedAchievements(db: ReturnType<typeof getDb>): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO achievements (id, title, description, icon, condition_type, condition_value) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertMany = db.transaction((achievements: typeof ACHIEVEMENTS) => {
    for (const a of achievements) {
      insert.run(a.id, a.title, a.description, a.icon, a.conditionType, a.conditionValue);
    }
  });
  try {
    insertMany(ACHIEVEMENTS);
  } catch {
    logger.debug('Achievements already seeded, skipping');
  }
}

export function initDatabase(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const hasDeletedAt = db
    .prepare("SELECT COUNT(*) as c FROM pragma_table_info('users') WHERE name = 'deleted_at'")
    .get() as { c: number };
  if (hasDeletedAt.c === 0) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN deleted_at INTEGER DEFAULT NULL`);
    } catch (err: unknown) {
      logger.error('Failed to add deleted_at column:', err);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS reset_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL,
      completed_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      PRIMARY KEY (user_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_type TEXT NOT NULL DEFAULT 'all_students',
      target_id TEXT,
      task_id TEXT,
      due_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used INTEGER,
      UNIQUE(user_id, endpoint)
    );

    CREATE TABLE IF NOT EXISTS reminder_log (
      id TEXT PRIMARY KEY,
      deadline_id TEXT REFERENCES deadlines(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      channel TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      error TEXT,
      UNIQUE(deadline_id, user_id, channel)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      channels_enabled TEXT NOT NULL DEFAULT '["in_app"]',
      reminder_intervals TEXT NOT NULL DEFAULT '[86400000,3600000]',
      teacher_notify_students INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_schedule (
      id TEXT PRIMARY KEY,
      deadline_id TEXT NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      channel TEXT NOT NULL,
      trigger_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at INTEGER,
      error TEXT,
      UNIQUE(deadline_id, user_id, channel, trigger_at)
    );

    CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  const columns = db.pragma('table_info(users)') as { name: string }[];
  const hasRole = columns.some((c) => c.name === 'role');
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
  }

  const hasLastActive = columns.some((c) => c.name === 'last_active');
  if (!hasLastActive) {
    db.exec('ALTER TABLE users ADD COLUMN last_active INTEGER');
  }

  const hasRoleChangedAt = columns.some((c) => c.name === 'role_changed_at');
  if (!hasRoleChangedAt) {
    db.exec('ALTER TABLE users ADD COLUMN role_changed_at INTEGER DEFAULT NULL');
  }

  const tables = db.pragma('table_list') as { name: string }[];
  const hasHintUsage = tables.some((t) => t.name === 'hint_usage');
  if (!hasHintUsage) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS hint_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        task_id TEXT NOT NULL,
        revealed_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_hint_usage_task ON hint_usage(task_id);
      CREATE INDEX IF NOT EXISTS idx_hint_usage_user ON hint_usage(user_id);
    `);
  }

  const hasGroups = tables.some((t) => t.name === 'groups');
  if (!hasGroups) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS "groups" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        teacher_id TEXT NOT NULL REFERENCES users(id),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_groups_teacher ON "groups"(teacher_id);

      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL REFERENCES "groups"(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (group_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
    `);
  }

  const userColumns = db.pragma('table_info(users)') as { name: string }[];
  if (!userColumns.some((c) => c.name === 'streak_current')) {
    db.exec('ALTER TABLE users ADD COLUMN streak_current INTEGER NOT NULL DEFAULT 0');
  }
  if (!userColumns.some((c) => c.name === 'streak_longest')) {
    db.exec('ALTER TABLE users ADD COLUMN streak_longest INTEGER NOT NULL DEFAULT 0');
  }
  if (!userColumns.some((c) => c.name === 'last_practice_date')) {
    db.exec('ALTER TABLE users ADD COLUMN last_practice_date INTEGER');
  }

  if (!columns.some((c) => c.name === 'banned_at')) {
    db.exec('ALTER TABLE users ADD COLUMN banned_at INTEGER DEFAULT NULL');
  }
  if (!columns.some((c) => c.name === 'ban_reason')) {
    db.exec('ALTER TABLE users ADD COLUMN ban_reason TEXT DEFAULT NULL');
  }
  if (!columns.some((c) => c.name === 'banned_by')) {
    db.exec('ALTER TABLE users ADD COLUMN banned_by TEXT DEFAULT NULL');
  }

  try {
    const deadlineColumns = db.pragma('table_info(deadlines)') as { name: string }[];
    if (!deadlineColumns.some((c) => c.name === 'group_id')) {
      db.exec('ALTER TABLE deadlines ADD COLUMN group_id TEXT DEFAULT NULL');
      db.exec('CREATE INDEX IF NOT EXISTS idx_deadlines_group ON deadlines(group_id)');
    }
  } catch {
    logger.debug('deadlines.group_id migration skipped');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_progress_completed_at ON user_progress(completed_at);
    CREATE INDEX IF NOT EXISTS idx_progress_task_id ON user_progress(task_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned_at);
  `);

  seedAchievements(db);
}
