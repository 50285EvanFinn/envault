import { Command } from 'commander';
import { registerBackupCommand } from './backup';
import * as vaultFile from '../../storage/vaultFile';
import * as vaultCrypto from '../../crypto/vault';
import * as envBackup from '../../env/envBackup';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerBackupCommand(program);
  return program;
}

const mockSalt = 'aabbcc';
const mockKey = Buffer.alloc(32);
const mockPayload = { entries: {}, backups: { backups: [] } };
const mockRaw = { salt: mockSalt, data: 'encryptedData' };

beforeEach(() => {
  jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
  jest.spyOn(vaultFile, 'readVault').mockReturnValue(mockRaw as any);
  jest.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
  jest.spyOn(vaultCrypto, 'deriveKey').mockResolvedValue(mockKey as any);
  jest.spyOn(vaultCrypto, 'decrypt').mockResolvedValue(JSON.stringify(mockPayload));
  jest.spyOn(vaultCrypto, 'encrypt').mockResolvedValue('newEncryptedData');
  jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
  jest.spyOn(require('readline'), 'createInterface').mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb('password'),
    close: () => {},
  });
});

afterEach(() => jest.restoreAllMocks());

describe('backup create', () => {
  it('creates a backup and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'create', 'my-backup']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('backup list', () => {
  it('prints no backups message when empty', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'list']);
    expect(spy).toHaveBeenCalledWith('No backups found.');
    spy.mockRestore();
  });

  it('lists backups when present', async () => {
    const record = envBackup.createBackup('v1', mockPayload as any);
    const store = envBackup.addBackup(envBackup.createEmptyBackupStore(), record);
    jest.spyOn(vaultCrypto, 'decrypt').mockResolvedValue(
      JSON.stringify({ ...mockPayload, backups: store })
    );
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('v1'));
    spy.mockRestore();
  });
});

describe('backup restore', () => {
  it('exits with error if backup id not found', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'backup', 'restore', 'nonexistent'])
    ).rejects.toThrow('exit');
  });
});

describe('backup delete', () => {
  it('deletes backup and writes vault', async () => {
    const record = envBackup.createBackup('v1', mockPayload as any);
    const store = envBackup.addBackup(envBackup.createEmptyBackupStore(), record);
    jest.spyOn(vaultCrypto, 'decrypt').mockResolvedValue(
      JSON.stringify({ ...mockPayload, backups: store })
    );
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'delete', record.id]);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('backup prune', () => {
  it('prunes backups and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'prune', '2']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});
