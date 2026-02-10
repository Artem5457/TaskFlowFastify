export const registerSchema = {
  body: {
    type: 'object',
    required: ['name', 'lastName', 'email', 'password'],
    additionalProperties: false,
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 100,
        pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).*$',
      },
    },
  },
  response: {
    201: {
      type: 'object',
      required: ['id', 'name', 'lastName', 'email'],
      additionalProperties: false,
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 100,
        pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).*$',
      },
    },
  },
};
