/**
 * Backup Service Tests
 * 
 * Validates AFSMS backup and recovery requirements:
 * - REQ-AFSMS-56: The system/database shall support offline backup
 * - NFR-AFSMS-SAFE-04: The database shall support offline backup for recovery
 * - Section 6.1: Student records maintained indefinitely; audit logs archived after 5 years
 */

const fs = require('fs');
const path = require('path');

// Mock fs and db before requiring backupService
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    accessSync: jest.fn(),
    promises: {
      writeFile: jest.fn().mockResolvedValue(undefined)
    },
    constants: actualFs.constants
  };
});

jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
  transaction: jest.fn()
}));

const db = require('../src/db');
const { TABLES_TO_BACKUP, createBackup } = require('../src/services/backupService');

describe('Backup Service (REQ-AFSMS-56, NFR-AFSMS-SAFE-04)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TABLES_TO_BACKUP should include all critical system tables', () => {
    // These tables are critical for full system recovery
    const criticalTables = [
      'student', 'grade', 'discipline', 'curriculum',
      'user_account', 'audit_log_entry', 'role'
    ];

    criticalTables.forEach(table => {
      expect(TABLES_TO_BACKUP).toContain(table);
    });

    // Should have a reasonable number of tables (at least the core ones)
    expect(TABLES_TO_BACKUP.length).toBeGreaterThanOrEqual(10);
  });

  test('createBackup should export all tables and write a JSON file', async () => {
    // Mock db.query to return rows for each table
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'test' }] });

    const result = await createBackup('admin-user-id', 'MANUAL');

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.filename).toContain('manual_backup_');
    expect(result.filename).toContain('.json');

    // Verify fs.promises.writeFile was called with JSON content
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    const writeCall = fs.promises.writeFile.mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1]);
    expect(writtenContent.version).toBe('1.0');
    expect(writtenContent.timestamp).toBeDefined();
    expect(writtenContent.data).toBeDefined();

    // Verify all tables were queried
    expect(db.query).toHaveBeenCalledTimes(TABLES_TO_BACKUP.length + 1); // +1 for BACKUP_JOB insert
  });

  test('createBackup should insert a record into BACKUP_JOB table', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await createBackup(null, 'AUTOMATIC');

    // Find the BACKUP_JOB insert call
    const backupJobCall = db.query.mock.calls.find(call =>
      call[0] && call[0].includes('INSERT INTO BACKUP_JOB')
    );

    expect(backupJobCall).toBeDefined();
    expect(backupJobCall[1]).toContain('AUTOMATIC');
    expect(backupJobCall[1][1]).toContain('automatic_backup_');
  });
});
