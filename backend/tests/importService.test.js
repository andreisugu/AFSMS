/**
 * Import Service Tests
 * 
 * Validates AFSMS data import requirements:
 * - REQ-AFSMS-18: Data extraction/import from databases, Excel files, and text files
 * - REQ-AFSMS-19: Filters and data transformations for database integration
 * - REQ-AFSMS-22: Validate imported data and generate error messages
 */

const { importStudents } = require('../src/services/importService');

// Mock the DB module with a pool-based interface (importService uses db.pool.connect)
jest.mock('../src/db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  return {
    pool: {
      connect: jest.fn().mockResolvedValue(mockClient)
    },
    query: jest.fn(),
    _mockClient: mockClient
  };
});

const db = require('../src/db');

describe('Import Service – importStudents (REQ-AFSMS-18, REQ-AFSMS-22)', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = db._mockClient;
    // Default: BEGIN and COMMIT succeed
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  test('should import valid students and return correct imported count', async () => {
    const students = [
      { first_name: 'Ion', last_name: 'Popescu', email: 'ion@ucv.ro' },
      { first_name: 'Maria', last_name: 'Ionescu', email: 'maria@ucv.ro' }
    ];

    // Mock: BEGIN, then for each student: INSERT returns a row, then COMMIT
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'id-1' }] }) // INSERT student 1
      .mockResolvedValueOnce({ rows: [{ id: 'id-2' }] }) // INSERT student 2
      .mockResolvedValueOnce({}); // COMMIT

    const result = await importStudents(students, 'actor-user-id');

    expect(result.imported).toBe(2);
    expect(result.rejected).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject students with missing required fields (REQ-AFSMS-22)', async () => {
    const students = [
      { first_name: 'Ion', last_name: '', email: 'ion@ucv.ro' },   // missing last_name
      { first_name: '', last_name: 'Test', email: 'test@ucv.ro' },  // missing first_name
      { first_name: 'Ana', last_name: 'Pop', email: '' }            // missing email
    ];

    mockClient.query
      .mockResolvedValueOnce({})  // BEGIN
      .mockResolvedValueOnce({}); // COMMIT

    const result = await importStudents(students, 'actor-user-id');

    expect(result.rejected).toBe(3);
    expect(result.imported).toBe(0);
    expect(result.errors.length).toBe(3);
    // Each error should mention the missing fields
    result.errors.forEach(err => {
      expect(err).toContain('Missing required fields');
    });
  });

  test('should handle duplicate registration numbers (ON CONFLICT → rejected)', async () => {
    const students = [
      { first_name: 'Ion', last_name: 'Popescu', email: 'ion@ucv.ro', registration_number: 'MAT001' }
    ];

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // INSERT returns empty (ON CONFLICT DO NOTHING)
      .mockResolvedValueOnce({}); // COMMIT

    const result = await importStudents(students, 'actor-user-id');

    expect(result.imported).toBe(0);
    expect(result.rejected).toBe(1);
    expect(result.errors[0]).toContain('already exists');
  });
});
