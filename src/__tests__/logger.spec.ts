import { Logger } from '@utils/log';

describe('Test LOGGER class', () => {
  test('Should show log correctly', async () => {
    const log = new Logger('Tester');
    log.setBugFallback(console.log);
    log.print('Hello', { background: '#123321', bold: true });
    log.i('textCase_1', 'This is info', {});
    log.w('textCase_1', 'This is warning', {});
    log.d('textCase_1', 'This is doing', {});
    log.b('textCase_1', 'This is bug', {});
  });
  test('Should show custom log correctly', async () => {
    const log = new Logger('Tester');
    log.setCustomLogFn(console.log);
    log.i('textCase_1', 'This is info', {});
    log.w('textCase_1', 'This is warning', {});
    log.d('textCase_1', 'This is doing', {});
    log.b('textCase_1', 'This is bug', {});
  });
});
