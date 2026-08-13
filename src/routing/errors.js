export class RouterError extends Error {
  constructor(message, { code = "routing_error", status = 400, details } = {}) {
    super(message);
    this.name = "RouterError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

