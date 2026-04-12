import { Command } from 'commander';
import { registerDeleteCommand } from './delete';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import * as envManager from '../../env/envManager';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('../../env/envManager');
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: (_q: string, cb: (a: string) => void) => cb('y'),
    close: jest.fn(),
  })),
}));

const mockVaultExists = vaultFile.vaultExists as jest.Mock;
const mockReadVault = vaultFile.readVault as jest.Mock;
const mockWriteVault = vaultFile.writeVault as jest.Mock;
const mockDecrypt = crypto.decrypt as jest.Mock;
const mockEncrypt = crypto.encrypt as jest.Mock;
const mockRemoveEntry = envManager.removeEntry as jest.Mock;

const sampleVault = {
  entries: {
    API_KEY: { value: 'secret', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVaultExists.mockReturnValue(true);
  mockReadVault.mockReturnValue('encrypted-data');
  mockDecrypt.mockResolvedValue(JSON.stringify(sampleVault));
  mockEncrypt.mockResolvedValue('new-encrypted-data');
  mockRemoveEntry.mockReturnValue({ entries: {} });
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.exitOverride();
  registerDeleteCommand(program);
  await program.parseAsync(['node', 'envault', ...args]);
}

describe('delete command', () => {
  it('deletes an existing key with --force flag', async () => {
    await runCommand(['delete', 'API_KEY', '--password', 'pass123', '--force']);
    expect(mockRemoveEntry).toHaveBeenCalledWith(sampleVault, 'API_KEY');
    expect(mockWriteVault).toHaveBeenCalledWith('new-encrypted-data');
  });

  it('exits if vault does not exist', async () => {
    mockVaultExists.mockReturnValue(false);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['delete', 'API_KEY', '--password', 'pass123', '--force'])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('exits if key not found in vault', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['delete', 'MISSING_KEY', '--password', 'pass123', '--force'])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('exits if no password provided', async () => {
    delete process.env.ENVAULT_PASSWORD;
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['delete', 'API_KEY', '--force'])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
