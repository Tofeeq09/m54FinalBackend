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
    this.userMessage = "There was a problem with your input. Please check it and try again.";
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized", source) {
    super(message, 401, source);
    this.userMessage = "You are not authorized to perform this action.";
  }
}

class ForbiddenError extends CustomError {
  constructor(message = "Forbidden", source) {
    super(message, 403, source);
    this.userMessage = "You are not allowed to perform this action.";
  }
}

class NotFoundError extends CustomError {
  constructor(message = "Resource not found", source) {
    super(message, 404, source);
    this.userMessage = "The resource you're looking for could not be found.";
  }
}
class DatabaseError extends CustomError {
  constructor(message = "Database error", source) {
    super(message, 500, source);
    this.userMessage = "An error occurred while processing your request. Please try again later.";
  }
}

class BcryptError extends CustomError {
  constructor(message = "Bcrypt error", source) {
    super(message, 500, source);
    this.userMessage = "An error occurred while processing your request. Please try again later.";
  }
}

class JwtError extends CustomError {
  constructor(message = "JWT error", source) {
    super(message, 500, source);
    this.userMessage = "An error occurred while processing your request. Please try again later.";
  }
}

const handleError = (err, req, res, next) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      userMessage: err.userMessage,
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
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  BcryptError,
  JwtError,
};
