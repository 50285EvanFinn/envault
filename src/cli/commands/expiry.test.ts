import { Command } from 'commander';
import { registerExpiryCommand } from './expiry';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('readline', () => ({
  createInterface: () => ({ question: (_: string, cb: Function) => cb('secret'), close: jest.fn() })
}));

const mockRaw = { data: 'encrypted' };
const basePayload = () => ({ entries: {}, expiry: {} });

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExpiryCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  (vaultFile.readVault as jest.Mock).mockResolvedValue(mockRaw);
  (vaultFile.writeVault as jest.Mock).mockResolvedValue(undefined);
  (crypto.encrypt as jest.Mock).mockResolvedValue('newEncrypted');
});

describe('expiry set', () => {
  it('sets expiry for a key', async () => {
    const payload = basePayload();
    (crypto.decrypt as jest.Mock).mockResolvedValue(payload);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'expiry', 'set', 'API_KEY', '2099-01-01']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
    expect(payload.expiry).toHaveProperty('API_KEY');
  });

  it('rejects invalid date', async () => {
    (crypto.decrypt as jest.Mock).mockResolvedValue(basePayload());
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'test', 'expiry', 'set', 'API_KEY', 'not-a-date'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});

describe('expiry remove', () => {
  it('removes expiry for a key', async () => {
    const payload = { entries: {}, expiry: { API_KEY: { expiresAt: '2099-01-01', setAt: new Date().toISOString() } } };
    (crypto.decrypt as jest.Mock).mockResolvedValue(payload);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'expiry', 'remove', 'API_KEY']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('expiry check', () => {
  it('reports no expiry when none set', async () => {
    (crypto.decrypt as jest.Mock).mockResolvedValue(basePayload());
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'expiry', 'check', 'MISSING']);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('No expiry'));
    log.mockRestore();
  });
});

describe('expiry list-expired', () => {
  it('lists no expired keys when none', async () => {
    (crypto.decrypt as jest.Mock).mockResolvedValue(basePayload());
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'expiry', 'list-expired']);
    expect(log).toHaveBeenCalledWith('No expired keys.');
    log.mockRestore();
  });
});
