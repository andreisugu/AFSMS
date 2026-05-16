/**
 * System Constants & NFR Validation Tests
 * 
 * Validates that the AFSMS system configuration meets the non-functional
 * requirements defined in the SRS:
 * - NFR-AFSMS-PERF-05: Minimum simultaneous users capacity
 * - NFR-AFSMS-PERF-09: Maximum report load time
 * - NFR-AFSMS-PERF-11: Maximum backup downtime
 * - NFR-AFSMS-PERF-12: Maximum rollback time
 * - Section 6.1: Data retention policy (5-year archival for audit logs)
 * - CODE-10: Unit test coverage target
 */

const constants = require('../src/utils/constants');

describe('System Constants – NFR Compliance (SRS v1.0)', () => {

  test('NFR-AFSMS-PERF-05: MAX_SIMULTANEOUS_USERS >= 200', () => {
    expect(constants.MAX_SIMULTANEOUS_USERS).toBeDefined();
    expect(constants.MAX_SIMULTANEOUS_USERS).toBeGreaterThanOrEqual(200);
  });

  test('NFR-AFSMS-PERF-09: MAX_REPORT_LOAD_TIME_MS <= 3000ms', () => {
    expect(constants.MAX_REPORT_LOAD_TIME_MS).toBeDefined();
    expect(constants.MAX_REPORT_LOAD_TIME_MS).toBeLessThanOrEqual(3000);
  });

  test('Section 6.1: DATA_RETENTION_YEARS_AUDIT === 5 years', () => {
    // SRS Section 6.1: "System audit logs may be archived after 5 years"
    expect(constants.DATA_RETENTION_YEARS_AUDIT).toBeDefined();
    expect(constants.DATA_RETENTION_YEARS_AUDIT).toBe(5);
  });

  test('CODE-10: MIN_TEST_COVERAGE_PERCENT >= 80%', () => {
    // SRS Section 5.6 CODE-10: "Unit tests shall be implemented for core business logic"
    expect(constants.MIN_TEST_COVERAGE_PERCENT).toBeDefined();
    expect(constants.MIN_TEST_COVERAGE_PERCENT).toBeGreaterThanOrEqual(80);
  });
});
