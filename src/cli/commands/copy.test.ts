import { Command } from 'commander';
import { registerCopyCommand } from './copy';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import * as envManager from '../../env/envManager';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('../../env/envManager');
jest.mock('readline', () => ({ createInterface: jest.fn(() => ({ close: jest.fn() })) }));

const mockVaultFile = vaultFile as jest.Mocked<typeof vaultFile>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;
const mockEnvManager = envManager as jest.Mocked<typeof envManager>;

function runCommand(args: string[]): Promise<void> {
  return new Promise((resolve) => {
    const program = new Command();
    program.exitOverride();
    registerCopyCommand(program);
    try {
      program.parse(['node', 'envault', ...args]);
    } catch {}
    resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest.spyOn(process.stdin, 'on').mockImplementation((event: any, cb: any) => {
    if (event === 'data') cb(Buffer.from('\n'));
    return process.stdin;
  });
});

describe('copy command', () => {
  it('should error if vault does not exist', async () => {
    mockVaultFile.vaultExists.mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runCommand(['copy', 'SRC', 'DEST'])).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('should error if source key not found', async () => {
    mockVaultFile.vaultExists.mockReturnValue(true);
    mockVaultFile.readVault.mockReturnValue('encrypted');
    mockCrypto.decrypt.mockResolvedValue({ entries: {} } as any);
    mockEnvManager.getEntry.mockReturnValue(undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runCommand(['copy', 'MISSING', 'DEST'])).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('should copy key successfully', async () => {
    mockVaultFile.vaultExists.mockReturnValue(true);
    mockVaultFile.readVault.mockReturnValue('encrypted');
    const vault = { entries: {} } as any;
    mockCrypto.decrypt.mockResolvedValue(vault);
    mockEnvManager.getEntry.mockReturnValueOnce({ key: 'SRC', value: 'hello', createdAt: '', updatedAt: '' });
    mockEnvManager.getEntry.mockReturnValueOnce(undefined);
    mockEnvManager.setEntry.mockReturnValue(vault);
    mockCrypto.encrypt.mockResolvedValue('newEncrypted');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['copy', 'SRC', 'DEST']);
    expect(mockVaultFile.writeVault).toHaveBeenCalledWith('newEncrypted');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Copied'));
  });
});
