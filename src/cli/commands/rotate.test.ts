import { Command } from 'commander';
import { registerRotateCommand } from './rotate';
import * as vaultFile from '../../storage/vaultFile';
import * as vaultCrypto from '../../crypto/vault';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('0'.repeat(32), 'hex')),
}));

const mockVaultExists = vaultFile.vaultExists as jest.MockedFunction<typeof vaultFile.vaultExists>;
const mockReadVault = vaultFile.readVault as jest.MockedFunction<typeof vaultFile.readVault>;
const mockWriteVault = vaultFile.writeVault as jest.MockedFunction<typeof vaultFile.writeVault>;
const mockDeriveKey = vaultCrypto.deriveKey as jest.MockedFunction<typeof vaultCrypto.deriveKey>;
const mockDecrypt = vaultCrypto.decrypt as jest.MockedFunction<typeof vaultCrypto.decrypt>;
const mockEncrypt = vaultCrypto.encrypt as jest.MockedFunction<typeof vaultCrypto.encrypt>;

describe('rotate command', () => {
  let program: Command;
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('exits with error if vault does not exist', async () => {
    mockVaultExists.mockResolvedValue(false);
    await registerRotateCommand(program);
    await expect(program.parseAsync(['node', 'test', 'rotate'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('exits with error if current password is incorrect', async () => {
    mockVaultExists.mockResolvedValue(true);
    mockReadVault.mockResolvedValue({ data: 'enc', iv: 'iv', salt: 'aabbccdd' });
    mockDeriveKey.mockResolvedValue('key' as any);
    mockDecrypt.mockRejectedValue(new Error('Decryption failed'));

    const rotate = require('./rotate');
    jest.spyOn(rotate, 'promptPassword').mockResolvedValueOnce('wrongpassword');

    await registerRotateCommand(program);
    await expect(program.parseAsync(['node', 'test', 'rotate'])).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Incorrect current password'));
  });

  it('exits with error if new passwords do not match', async () => {
    mockVaultExists.mockResolvedValue(true);
    mockReadVault.mockResolvedValue({ data: 'enc', iv: 'iv', salt: 'aabbccdd' });
    mockDeriveKey.mockResolvedValue('key' as any);
    mockDecrypt.mockResolvedValue('{"entries":{}}');

    const rotate = require('./rotate');
    jest.spyOn(rotate, 'promptPassword')
      .mockResolvedValueOnce('currentpass')
      .mockResolvedValueOnce('newpass123')
      .mockResolvedValueOnce('different123');

    await registerRotateCommand(program);
    await expect(program.parseAsync(['node', 'test', 'rotate'])).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('do not match'));
  });
});
