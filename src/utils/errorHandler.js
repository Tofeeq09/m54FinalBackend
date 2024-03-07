// src/utils/errorHandler.js

class CustomError extends Error {
  constructor(message, statusCode, source) {
    super(message);
    this.statusCode = statusCode;
    this.source = source;
  }
}

class ValidationError extends CustomError {
  constructor(message = "Invalid user input", source) {
    super(message, 400, source);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized", source) {
    super(message, 401, source);
  }
}

class NotFoundError extends CustomError {
  constructor(message = "Resource not found", source) {
    super(message, 404, source);
  }
}

class DatabaseError extends CustomError {
  constructor(message = "Database error", source) {
    super(message, 500, source);
  }
}

class BcryptError extends CustomError {
  constructor(message = "Bcrypt error", source) {
    super(message, 500, source);
  }
}

class JwtError extends CustomError {
  constructor(message = "JWT error", source) {
    super(message, 500, source);
  }
}

const handleError = (err, req, res, next) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      method: req.method,
      url: req.originalUrl,
      source: err.source,
    });
    return;
  }

  const errorResponse = {
    success: false,
    error: "Server error",
    method: req.method,
    url: req.originalUrl,
  };

  if (err.source) {
    errorResponse.source = err.source;
  }

  res.status(500).json(errorResponse);
  return;
};

module.exports = {
  handleError,
  CustomError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  DatabaseError,
  BcryptError,
  JwtError,
};
