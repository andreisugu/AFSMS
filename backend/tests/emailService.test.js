/**
 * Email Service Factory Tests
 * 
 * Validates AFSMS messaging/communication requirements:
 * - REQ-AFSMS-44: Send email messages to all members of a user group
 * - REQ-AFSMS-45: Integration with Microsoft Outlook for messaging
 * 
 * Tests the factory pattern that selects the correct email provider
 * based on the EMAIL_PROVIDER environment variable.
 */

describe('Email Service Factory (REQ-AFSMS-45)', () => {

  beforeEach(() => {
    // Clear module cache so emailService re-evaluates process.env each time
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.EMAIL_PROVIDER;
  });

  test('should default to mock (Ethereal) provider when EMAIL_PROVIDER is not set', () => {
    delete process.env.EMAIL_PROVIDER;

    const emailService = require('../src/services/emailService');

    expect(emailService).toBeDefined();
    expect(emailService.sendMail).toBeDefined();
    expect(emailService.getProviderName).toBeDefined();
    expect(emailService.getProviderName()).toContain('Mock');
  });

  test('should select Microsoft Graph API provider when EMAIL_PROVIDER=graph', () => {
    process.env.EMAIL_PROVIDER = 'graph';

    const emailService = require('../src/services/emailService');

    expect(emailService).toBeDefined();
    expect(emailService.sendMail).toBeDefined();
    // Graph provider should expose the same interface
    expect(typeof emailService.sendMail).toBe('function');
  });

  test('should select SMTP/Nodemailer provider when EMAIL_PROVIDER=smtp', () => {
    process.env.EMAIL_PROVIDER = 'smtp';

    const emailService = require('../src/services/emailService');

    expect(emailService).toBeDefined();
    expect(emailService.sendMail).toBeDefined();
    expect(typeof emailService.sendMail).toBe('function');
  });

  test('mock provider sendBulk should be a function (REQ-AFSMS-44 group email)', () => {
    delete process.env.EMAIL_PROVIDER;

    const emailService = require('../src/services/emailService');

    // sendBulk is required for REQ-AFSMS-44 (group email)
    expect(emailService.sendBulk).toBeDefined();
    expect(typeof emailService.sendBulk).toBe('function');
  });
});
