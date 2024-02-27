class ApiError extends Error {
  constructor({
    errorMessage = "something went wrong",
    statusCode = 0,
    errors = [],
    stack = "",
  }) {
    super(errorMessage);
    this.statusCode = statusCode > 400 ? statusCode : null;
    this.errorMessage = errorMessage;
    this.errors = errors;
    stack;
    this.success = false;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
