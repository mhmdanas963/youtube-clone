class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.message = message;
    this.statusCode = statusCode ? statusCode < 300 : null;
    this.data = data;
  }
}
