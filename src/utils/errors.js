class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

class AuthenticationError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

class AuthorizationError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}

class NotFoundError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

class ConflictError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

class InternalError extends BaseError {
  constructor(message) {
    super(message);
    this.statusCode = 500;
  }
}

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError
};
