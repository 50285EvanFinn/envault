import { Command } from 'commander';
import { registerSnapshotCommand } from './snapshot';
import * as vaultFile from '../../storage/vaultFile';
import * as vault from '../../crypto/vault';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('readline', () => ({
  createInterface: () => ({ question: (_: string, cb: (a: string) => void) => cb('secret'), close: jest.fn() }),
}));

const mockKey = Buffer.from('key');
const basePayload = {
  version: 1,
  entries: {
    FOO: { value: 'bar', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  },
  snapshots: { snapshots: [] },
};
const mockRaw = { salt: 'aabbcc', data: 'encrypted' };

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  (vaultFile.readVault as jest.Mock).mockReturnValue(mockRaw);
  (vault.deriveKey as jest.Mock).mockResolvedValue(mockKey);
  (vault.decrypt as jest.Mock).mockResolvedValue(JSON.stringify(basePayload));
  (vault.encrypt as jest.Mock).mockResolvedValue('newEncrypted');
  (vaultFile.writeVault as jest.Mock).mockImplementation(() => {});
});

describe('snapshot save', () => {
  it('saves a new snapshot and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', 'save', 'before-deploy']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
    const written = (vaultFile.writeVault as jest.Mock).mock.calls[0][0];
    expect(written.data).toBe('newEncrypted');
  });
});

describe('snapshot list', () => {
  it('lists snapshots when none exist', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No snapshots found.');
    consoleSpy.mockRestore();
  });
});

describe('snapshot delete', () => {
  it('calls writeVault after deleting', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot', 'delete', 'snap_123']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('snapshot restore', () => {
  it('exits with error when snapshot not found', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'snapshot', 'restore', 'nonexistent'])
    ).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
