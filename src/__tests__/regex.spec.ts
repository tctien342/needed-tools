import { CommonRegex } from '@utils/regex';

describe('CommonRegex', () => {
  it('should match a valid email', () => {
    const email = 'test@example.com';
    expect(CommonRegex.email.test(email)).toBe(true);
  });

  it('should not match an invalid email', () => {
    const email = 'invalid-email';
    expect(CommonRegex.email.test(email)).toBe(false);
  });

  it('should match a valid hex color code', () => {
    const hex = '#FF0000';
    expect(CommonRegex.hex.test(hex)).toBe(true);
  });

  it('should not match an invalid hex color code', () => {
    const hex = 'invalid-hex';
    expect(CommonRegex.hex.test(hex)).toBe(false);
  });

  it('should match a valid number', () => {
    const number = '123.45';
    expect(CommonRegex.number.test(number)).toBe(true);
  });

  it('should not match an invalid number', () => {
    const number = 'invalid-number';
    expect(CommonRegex.number.test(number)).toBe(false);
  });

  it('should match a valid phone number', () => {
    const phone = '+1234567890';
    expect(CommonRegex.phone.test(phone)).toBe(true);
  });

  it('should not match an invalid phone number', () => {
    const phone = 'invalid-phone';
    expect(CommonRegex.phone.test(phone)).toBe(false);
  });
});
