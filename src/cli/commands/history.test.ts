import { Command } from 'commander';
import { registerHistoryCommand } from './history';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import * as initModule from './init';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('./init');

const mockReadVault = vaultFile.readVault as jest.MockedFunction<typeof vaultFile.readVault>;
const mockDecrypt = crypto.decrypt as jest.MockedFunction<typeof crypto.decrypt>;
const mockPromptPassword = initModule.promptPassword as jest.MockedFunction<typeof initModule.promptPassword>;

function buildVaultPayload(records: any[]) {
  return JSON.stringify({ entries: {}, history: { records } });
}

async function runCommand(args: string[]) {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommand(program);
  await program.parseAsync(['node', 'envault', 'history', ...args]);
}

describe('history command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPromptPassword.mockResolvedValue('secret');
    mockReadVault.mockResolvedValue('encrypted-data' as any);
  });

  it('shows message when no history exists', async () => {
    mockDecrypt.mockResolvedValue(buildVaultPayload([]));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand([]);
    expect(spy).toHaveBeenCalledWith('No history records found.');
    spy.mockRestore();
  });

  it('displays history records', async () => {
    const records = [
      { key: 'API_KEY', action: 'set', previousValue: undefined, newValue: 'abc', timestamp: Date.now() },
    ];
    mockDecrypt.mockResolvedValue(buildVaultPayload(records));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand([]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Vault History'));
    spy.mockRestore();
  });

  it('filters by key', async () => {
    const records = [
      { key: 'API_KEY', action: 'set', previousValue: undefined, newValue: 'abc', timestamp: Date.now() },
      { key: 'DB_URL', action: 'set', previousValue: undefined, newValue: 'db', timestamp: Date.now() },
    ];
    mockDecrypt.mockResolvedValue(buildVaultPayload(records));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['--key', 'DB_URL']);
    const calls = spy.mock.calls.flat().join(' ');
    expect(calls).toContain('DB_URL');
    spy.mockRestore();
  });

  it('shows no matching records message when filter yields nothing', async () => {
    const records = [
      { key: 'API_KEY', action: 'set', previousValue: undefined, newValue: 'abc', timestamp: Date.now() },
    ];
    mockDecrypt.mockResolvedValue(buildVaultPayload(records));
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['--key', 'NONEXISTENT']);
    expect(spy).toHaveBeenCalledWith('No matching history records found.');
    spy.mockRestore();
  });

  it('handles decrypt error gracefully', async () => {
    mockDecrypt.mockRejectedValue(new Error('Wrong password'));
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand([])).rejects.toThrow('exit');
    expect(spy).toHaveBeenCalledWith('Error reading history:', 'Wrong password');
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});
