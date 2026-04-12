import { Command } from 'commander';
import { registerGetCommand } from './get';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import * as envManager from '../../env/envManager';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('../../env/envManager');

const mockVaultExists = vaultFile.vaultExists as jest.MockedFunction<typeof vaultFile.vaultExists>;
const mockReadVault = vaultFile.readVault as jest.MockedFunction<typeof vaultFile.readVault>;
const mockDecrypt = crypto.decrypt as jest.MockedFunction<typeof crypto.decrypt>;
const mockGetEntry = envManager.getEntry as jest.MockedFunction<typeof envManager.getEntry>;

describe('get command', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerGetCommand(program);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should print error if vault does not exist', async () => {
    mockVaultExists.mockReturnValue(false);
    await expect(program.parseAsync(['node', 'envault', 'get', 'API_KEY', '--password', 'secret'])).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('should print error if password is not provided', async () => {
    mockVaultExists.mockReturnValue(true);
    delete process.env.ENVAULT_PASSWORD;
    await expect(program.parseAsync(['node', 'envault', 'get', 'API_KEY'])).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Password is required'));
  });

  it('should print the value for an existing key', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'encrypted-data', version: 1 });
    mockDecrypt.mockResolvedValue(JSON.stringify({ entries: {} }));
    mockGetEntry.mockReturnValue({ value: 'my-secret-value', createdAt: Date.now(), updatedAt: Date.now() });

    await program.parseAsync(['node', 'envault', 'get', 'API_KEY', '--password', 'secret']);
    expect(consoleLogSpy).toHaveBeenCalledWith('my-secret-value');
  });

  it('should print in export format when --export flag is used', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'encrypted-data', version: 1 });
    mockDecrypt.mockResolvedValue(JSON.stringify({ entries: {} }));
    mockGetEntry.mockReturnValue({ value: 'my-secret-value', createdAt: Date.now(), updatedAt: Date.now() });

    await program.parseAsync(['node', 'envault', 'get', 'API_KEY', '--password', 'secret', '--export']);
    expect(consoleLogSpy).toHaveBeenCalledWith('export API_KEY=my-secret-value');
  });

  it('should print error if key is not found', async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockReturnValue({ data: 'encrypted-data', version: 1 });
    mockDecrypt.mockResolvedValue(JSON.stringify({ entries: {} }));
    mockGetEntry.mockReturnValue(undefined);

    await expect(program.parseAsync(['node', 'envault', 'get', 'MISSING_KEY', '--password', 'secret'])).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found in vault'));
  });
});
