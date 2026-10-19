export class FlowError extends Error {
  constructor(code, message, { statusCode = 409, details } = {}) {
    super(message);
    this.name = 'FlowError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class FlowBusyError extends FlowError {
  constructor(message = 'Google Flow is already working on another shot') {
    super('flow_busy', message, { statusCode: 409 });
    this.name = 'FlowBusyError';
  }
}

export class FlowAutomationError extends FlowError {
  constructor(message, details) {
    super('flow_automation_failed', message, { statusCode: 502, details });
    this.name = 'FlowAutomationError';
  }
}

export function flowUnavailable(message) {
  return new FlowError('flow_unavailable', message, { statusCode: 503 });
}
