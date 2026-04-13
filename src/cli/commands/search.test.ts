import { Command } from 'commander';
import { registerSearchCommand } from './search';
import * as vaultFile from '../../storage/vaultFile';
import * as cryptoVault from '../../crypto/vault';
import * as envManager from '../../env/envManager';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('../../env/envManager');

const mockVaultExists = vaultFile.vaultExists as jest.Mock;
const mockReadVault = vaultFile.readVault as jest.Mock;
const mockDecrypt = cryptoVault.decrypt as jest.Mock;
const mockListEntries = envManager.listEntries as jest.Mock;

function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program.parseAsync(['node', 'envault', ...args]);
}

describe('search command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  it('exits if vault does not exist', async () => {
    mockVaultExists.mockReturnValue(false);
    await expect(runCommand(['search', 'DB', '--password', 'pass'])).rejects.toThrow('exit');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('exits if password is not provided', async () => {
    mockVaultExists.mockReturnValue(true);
    await expect(runCommand(['search', 'DB'])).rejects.toThrow('exit');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Password is required'));
  });

  it('shows no matches message when nothing found', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'enc', salt: 's', iv: 'i' });
    mockDecrypt.mockResolvedValue(JSON.stringify({}));
    mockListEntries.mockReturnValue([]);
    await runCommand(['search', 'DB', '--password', 'pass']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No keys matching'));
  });

  it('lists matching keys', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'enc', salt: 's', iv: 'i' });
    const parsed = { DB_HOST: { value: 'localhost' }, DB_PORT: { value: '5432' }, API_KEY: { value: 'secret' } };
    mockDecrypt.mockResolvedValue(JSON.stringify(parsed));
    mockListEntries.mockReturnValue(['DB_HOST', 'DB_PORT', 'API_KEY']);
    await runCommand(['search', 'DB', '--password', 'pass']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 match(es)'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DB_HOST'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DB_PORT'));
  });

  it('shows values when --show-values flag is used', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'enc', salt: 's', iv: 'i' });
    const parsed = { DB_HOST: { value: 'localhost' } };
    mockDecrypt.mockResolvedValue(JSON.stringify(parsed));
    mockListEntries.mockReturnValue(['DB_HOST']);
    await runCommand(['search', 'DB', '--password', 'pass', '--show-values']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DB_HOST=localhost'));
  });
});
