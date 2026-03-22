import { z } from 'zod';
import { insertItemSchema, insertBranchSchema, insertFloorSchema, insertRackSchema, insertUserSchema, items, users, branches, floors, racks } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === BRANCHES ===
  branches: {
    list: {
      method: 'GET' as const,
      path: '/api/branches',
      responses: {
        200: z.array(z.custom<typeof branches.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/branches/:id',
      responses: {
        200: z.any(), // BranchWithFloors
        404: errorSchemas.notFound,
      },
    },
    getByQr: {
      method: 'GET' as const,
      path: '/api/branches/qr/:qrId',
      responses: {
        200: z.custom<typeof branches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/branches',
      input: insertBranchSchema,
      responses: {
        201: z.custom<typeof branches.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/branches/:id',
      responses: {
        204: z.void(),
      },
    },
  },

  // === FLOORS ===
  floors: {
    list: {
      method: 'GET' as const,
      path: '/api/branches/:branchId/floors',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/branches/:branchId/floors',
      input: insertFloorSchema.omit({ branchId: true }),
      responses: {
        201: z.custom<typeof floors.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/floors/:id',
      responses: {
        204: z.void(),
      },
    },
  },

  // === RACKS ===
  racks: {
    list: {
      method: 'GET' as const,
      path: '/api/floors/:floorId/racks',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/floors/:floorId/racks',
      input: insertRackSchema.omit({ floorId: true }),
      responses: {
        201: z.custom<typeof racks.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/racks/:id',
      responses: {
        204: z.void(),
      },
    },
  },

  // === ITEMS ===
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/items',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        branchId: z.string().optional(),
        rackId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof items.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/items/:id',
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/items',
      input: insertItemSchema,
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/items/:id',
      input: insertItemSchema.partial(),
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/items/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === USERS ===
  users: {
    login: {
      method: 'POST' as const,
      path: '/api/users/login',
      input: z.object({
        identifier: z.string(),
        password: z.string().optional(),
        role: z.enum(['customer', 'branch_manager', 'hq_admin']).default('customer'),
        branchId: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.internal,
      },
    },
    createManager: {
      method: 'POST' as const,
      path: '/api/users/manager',
      input: z.object({
        username: z.string(),
        password: z.string(),
        branchId: z.number(),
        name: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
      },
    },
  },

  // === SALES ===
  sales: {
    create: {
      method: 'POST' as const,
      path: '/api/sales',
      input: z.object({
        branchId: z.number(),
        userId: z.number().optional(),
        items: z.array(z.object({
          itemId: z.number(),
          quantity: z.number(),
        })),
      }),
      responses: {
        201: z.object({ success: z.boolean(), saleId: z.number() }),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/branches/:branchId/sales/stats',
      responses: {
        200: z.any(),
      },
    },
  },

  // === AI CHAT ===
  chat: {
    message: {
      method: 'POST' as const,
      path: '/api/chat',
      input: z.object({
        message: z.string(),
        branchId: z.number(),
      }),
      responses: {
        200: z.any(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
