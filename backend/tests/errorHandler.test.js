/**
 * Error Handler Middleware Tests
 * 
 * Validates AFSMS error handling requirements:
 * - REQ-AFSMS-48: Invalid input → error message displayed
 * - REQ-AFSMS-49: Frequent validation errors → resolution suggestions
 * - NFR-AFSMS-SAFE-07: Validation failure → display error + suggest resolution
 */

const errorHandler = require('../src/middleware/errorHandler');

describe('Error Handler Middleware (REQ-AFSMS-48, REQ-AFSMS-49)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('should handle unique_violation (PG 23505) → 409 with resolution hint', () => {
    const err = { code: '23505', message: 'duplicate key value' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: 'UNIQUE_VIOLATION',
        suggestion: 'suggest_unique'
      })
    );
    // REQ-AFSMS-49: resolution hint provided
    const response = res.json.mock.calls[0][0];
    expect(response.resolutionHint).toBeDefined();
    expect(response.resolutionHint.length).toBeGreaterThan(0);
  });

  test('should handle foreign_key_violation (PG 23503) → 400', () => {
    const err = { code: '23503', message: 'foreign key violation' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: 'FOREIGN_KEY_VIOLATION',
        suggestion: 'suggest_fk'
      })
    );
  });

  test('should handle check_violation (PG 23514) → 400 with grade range hint', () => {
    const err = { code: '23514', message: 'check constraint violated' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CHECK_VIOLATION',
        suggestion: 'suggest_grade_range'
      })
    );
    // REQ-AFSMS-49: grade range hint (1–10)
    const response = res.json.mock.calls[0][0];
    expect(response.resolutionHint).toContain('1');
    expect(response.resolutionHint).toContain('10');
  });

  test('should handle not_null_violation (PG 23502) → 400', () => {
    const err = { code: '23502', message: 'not null constraint' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_NULL_VIOLATION',
        suggestion: 'suggest_not_null'
      })
    );
  });

  test('should handle custom application error with err.status', () => {
    const err = new Error('Entity not found');
    err.status = 404;
    err.customCode = 'NOT_FOUND';
    err.customMessage = 'Student not found in database';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: 'NOT_FOUND',
        message: 'Student not found in database'
      })
    );
  });

  test('should return 500 for unknown/unhandled errors', () => {
    const err = new Error('Something unexpected happened');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: 'INTERNAL_SERVER_ERROR'
      })
    );
  });
});
