/**
 * Swagger/OpenAPI Configuration
 * API documentation setup for ChromaVault
 */

import { Options } from 'swagger-jsdoc';
import { apiConfig } from './api.config';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChromaVault API',
      version: '1.0.0',
      description: `
        ChromaVault is a comprehensive color palette management platform that provides:
        
        - **Palette Management**: Create, organize, and share color palettes
        - **Real-time Collaboration**: Work together on color schemes
        - **AI-Powered Features**: Intelligent color analysis and recommendations
        - **Advanced Color Tools**: Color blindness simulation, harmony generation
        - **Social Features**: Community sharing, favorites, and collections
        
        ## Authentication
        
        Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        
        API requests are rate-limited to prevent abuse. Current limits:
        - **100 requests per 15 minutes** for authenticated users
        - **20 requests per 15 minutes** for unauthenticated users
        
        ## Error Handling
        
        All API responses follow a consistent format:
        
        **Success Response:**
        \`\`\`json
        {
          "success": true,
          "message": "Operation successful",
          "data": {...},
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
        \`\`\`
        
        **Error Response:**
        \`\`\`json
        {
          "success": false,
          "message": "Error description",
          "error": {
            "code": "ERROR_CODE",
            "details": {...}
          },
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
        \`\`\`
      `,
      contact: {
        name: 'ChromaVault API Support',
        email: 'support@chromavault.com',
        url: 'https://chromavault.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${apiConfig.PORT}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.chromavault.com/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server communication',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            avatar: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'PRO', 'ADMIN', 'MODERATOR'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
          },
        },

        // Palette schemas
        Palette: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            slug: { type: 'string' },
            isPublic: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            viewCount: { type: 'integer' },
            downloadCount: { type: 'integer' },
            version: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            userId: { type: 'string', format: 'uuid' },
            user: { $ref: '#/components/schemas/User' },
            colors: {
              type: 'array',
              items: { $ref: '#/components/schemas/Color' },
            },
            tags: {
              type: 'array',
              items: { $ref: '#/components/schemas/Tag' },
            },
          },
        },
        PaletteInput: {
          type: 'object',
          required: ['name', 'colors'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            isPublic: { type: 'boolean', default: false },
            colors: {
              type: 'array',
              minItems: 1,
              maxItems: 20,
              items: { $ref: '#/components/schemas/ColorInput' },
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            categories: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
            },
          },
        },

        // Color schemas
        Color: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            rgb: {
              type: 'object',
              properties: {
                r: { type: 'integer', minimum: 0, maximum: 255 },
                g: { type: 'integer', minimum: 0, maximum: 255 },
                b: { type: 'integer', minimum: 0, maximum: 255 },
              },
            },
            hsl: {
              type: 'object',
              properties: {
                h: { type: 'number', minimum: 0, maximum: 360 },
                s: { type: 'number', minimum: 0, maximum: 100 },
                l: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
            lab: {
              type: 'object',
              properties: {
                l: { type: 'number', minimum: 0, maximum: 100 },
                a: { type: 'number', minimum: -128, maximum: 127 },
                b: { type: 'number', minimum: -128, maximum: 127 },
              },
            },
            name: { type: 'string', nullable: true },
            position: { type: 'integer' },
            paletteId: { type: 'string', format: 'uuid' },
          },
        },
        ColorInput: {
          type: 'object',
          required: ['hex', 'position'],
          properties: {
            hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            name: { type: 'string' },
            position: { type: 'integer', minimum: 0 },
          },
        },

        // Tag schemas
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            usageCount: { type: 'integer' },
          },
        },

        // Category schemas
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            icon: { type: 'string', nullable: true },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
        },

        // Collection schemas
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            userId: { type: 'string', format: 'uuid' },
            user: { $ref: '#/components/schemas/User' },
            palettes: {
              type: 'array',
              items: { $ref: '#/components/schemas/Palette' },
            },
          },
        },

        // Authentication schemas
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'integer' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            rememberMe: { type: 'boolean', default: false },
          },
        },

        // Common schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                details: { type: 'object' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },

        // AI Analysis schemas
        ColorAnalysis: {
          type: 'object',
          properties: {
            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            name: { type: 'string' },
            emotions: {
              type: 'array',
              items: { type: 'string' },
            },
            associations: {
              type: 'array',
              items: { type: 'string' },
            },
            accessibility: {
              type: 'object',
              properties: {
                wcagLevel: { type: 'string', enum: ['AA', 'AAA', 'FAIL'] },
                contrastRatio: { type: 'number' },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        PaletteAnalysis: {
          type: 'object',
          properties: {
            harmony: { type: 'string', enum: ['monochromatic', 'analogous', 'complementary', 'triadic', 'tetradic', 'custom'] },
            temperature: { type: 'string', enum: ['warm', 'cool', 'neutral', 'mixed'] },
            mood: { type: 'string' },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
            colorBlindnessInfo: {
              type: 'object',
              properties: {
                protanopia: { type: 'object' },
                deuteranopia: { type: 'object' },
                tritanopia: { type: 'object' },
              },
            },
          },
        },

        // Real-time collaboration schemas
        CollaborationSession: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            paletteId: { type: 'string', format: 'uuid' },
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  avatar: { type: 'string' },
                  cursor: {
                    type: 'object',
                    properties: {
                      x: { type: 'number' },
                      y: { type: 'number' },
                    },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            lastActivity: { type: 'string', format: 'date-time' },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination',
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Number of items per page',
        },
        SortParam: {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string' },
          description: 'Field to sort by',
        },
        OrderParam: {
          name: 'order',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          description: 'Sort order',
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search query',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Authentication required',
                error: { code: 'UNAUTHORIZED', details: {} },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Access denied',
                error: { code: 'FORBIDDEN', details: {} },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Resource not found',
                error: { code: 'NOT_FOUND', details: {} },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: {
                    field: 'email',
                    message: 'Invalid email format',
                  },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  details: { retryAfter: 900 },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'Palettes',
        description: 'Color palette CRUD operations',
      },
      {
        name: 'Colors',
        description: 'Individual color management and analysis',
      },
      {
        name: 'Collections',
        description: 'Palette collections and organization',
      },
      {
        name: 'Collaboration',
        description: 'Real-time collaboration features',
      },
      {
        name: 'AI Analysis',
        description: 'AI-powered color analysis and recommendations',
      },
      {
        name: 'Upload',
        description: 'File upload and image processing',
      },
      {
        name: 'Admin',
        description: 'Administrative operations',
      },
    ],
  },
  apis: [
    './src/server/routes/*.ts', // Path to the API docs
  ],
};

export default swaggerOptions;