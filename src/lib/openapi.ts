export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SQL Trainer API',
    description: 'REST API for SQL Trainer — interactive SQL learning platform',
    version: '0.3.0',
  },
  servers: [{ url: '/api', description: 'API' }],
  paths: {
    '/sql': {
      post: {
        tags: ['SQL'],
        summary: 'Execute a SQL query',
        description: 'Runs a SQL query against the selected database dialect and returns results.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SqlExecuteRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Query executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    columns: { type: 'array', items: { type: 'string' } },
                    rows: { type: 'array', items: { type: 'object' } },
                    executionTime: { type: 'number' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/sql/verify': {
      post: {
        tags: ['SQL'],
        summary: 'Verify a task solution',
        description: 'Compares user SQL against the expected solution for a given task.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SqlVerifyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verified: { type: 'boolean' },
                    userRowCount: { type: 'integer' },
                    expectedRowCount: { type: 'integer' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { description: 'Task not found' },
        },
      },
    },
    '/sql/explain': {
      post: {
        tags: ['SQL'],
        summary: 'Get query execution plan',
        description: 'Returns the EXPLAIN plan for a SQL query.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SqlExplainRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Execution plan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    plan: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/user/progress': {
      get: {
        tags: ['User'],
        summary: 'Get user progress',
        description: "Returns the authenticated user's learning progress, streak, and achievements.",
        security: [{ sessionAuth: [] }],
        responses: {
          '200': {
            description: 'User progress data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    progress: { type: 'array', items: { $ref: '#/components/schemas/TaskProgress' } },
                    streak: { $ref: '#/components/schemas/Streak' },
                    userStats: { $ref: '#/components/schemas/UserStats' },
                    unlockedAchievements: { type: 'array', items: { $ref: '#/components/schemas/Achievement' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['User'],
        summary: 'Update user progress',
        description: "Records a task attempt and updates the user's progress.",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProgressUpdateRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Progress updated' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Registration successful' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns system health status including database connectivity.',
        responses: {
          '200': {
            description: 'System healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'degraded'] },
                    uptime: { type: 'number' },
                    database: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth.js session cookie',
      },
    },
    schemas: {
      SqlExecuteRequest: {
        type: 'object',
        required: ['sql'],
        properties: {
          sql: { type: 'string', minLength: 1, maxLength: 10000, description: 'SQL query to execute' },
          dbType: {
            type: 'string',
            enum: ['sqlite', 'postgresql', 'clickhouse', 'mongodb'],
            description: 'Database dialect',
          },
          taskId: { type: 'string', description: 'Optional task ID for context' },
        },
      },
      SqlVerifyRequest: {
        type: 'object',
        required: ['sql', 'taskId'],
        properties: {
          sql: { type: 'string', minLength: 1, maxLength: 10000, description: 'User SQL solution' },
          taskId: { type: 'string', minLength: 1, description: 'Task identifier' },
          dbType: { type: 'string', description: 'Override database dialect' },
        },
      },
      SqlExplainRequest: {
        type: 'object',
        required: ['sql', 'taskId'],
        properties: {
          sql: { type: 'string', minLength: 1, maxLength: 10000, description: 'SQL query to explain' },
          dbType: { type: 'string', enum: ['sqlite', 'postgresql', 'mongodb'] },
          taskId: { type: 'string', minLength: 1, description: 'Task identifier' },
        },
      },
      ProgressUpdateRequest: {
        type: 'object',
        required: ['taskId', 'attempts'],
        properties: {
          taskId: { type: 'string', minLength: 1 },
          attempts: { type: 'integer', minimum: 0 },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['student', 'teacher'], default: 'student' },
        },
      },
      TaskProgress: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          attempts: { type: 'integer' },
          completedAt: { type: 'number', description: 'Timestamp (ms)' },
        },
      },
      Streak: {
        type: 'object',
        properties: {
          currentStreak: { type: 'integer' },
          longestStreak: { type: 'integer' },
          totalPracticeDays: { type: 'integer' },
        },
      },
      UserStats: {
        type: 'object',
        properties: {
          level: { type: 'integer' },
          xp: { type: 'integer' },
          levelProgress: { type: 'number' },
        },
      },
      Achievement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          unlockedAt: { type: 'number' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string' },
              },
            },
          },
        },
      },
      RateLimited: {
        description: 'Rate limited',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                verified: { type: 'boolean', example: false },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Not authenticated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const;
