import { Command } from 'commander';
import { registerListCommand } from './list';
import * as envIndex from '../../env';
import * as vaultFile from '../../storage/vaultFile';

jest.mock('../../env');
jest.mock('../../storage/vaultFile');

const mockLoadEnvManager = envIndex.loadEnvManager as jest.MockedFunction<typeof envIndex.loadEnvManager>;
const mockGetVaultPath = vaultFile.getVaultPath as jest.MockedFunction<typeof vaultFile.getVaultPath>;

describe('list command', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerListCommand(program);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

    mockGetVaultPath.mockReturnValue('/mock/.envault/vault.enc');
    process.env.ENVAULT_PASSWORD = 'test-password';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ENVAULT_PASSWORD;
  });

  it('lists keys when vault has entries', async () => {
    const mockManager = { listKeys: jest.fn().mockReturnValue(['API_KEY', 'DB_URL']), get: jest.fn() };
    mockLoadEnvManager.mockResolvedValue(mockManager as any);

    await program.parseAsync(['node', 'envault', 'list']);

    expect(mockManager.listKeys).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2 variable(s)'));
    expect(consoleLogSpy).toHaveBeenCalledWith('  API_KEY');
    expect(consoleLogSpy).toHaveBeenCalledWith('  DB_URL');
  });

  it('shows message when vault is empty', async () => {
    const mockManager = { listKeys: jest.fn().mockReturnValue([]), get: jest.fn() };
    mockLoadEnvManager.mockResolvedValue(mockManager as any);

    await program.parseAsync(['node', 'envault', 'list']);

    expect(consoleLogSpy).toHaveBeenCalledWith('No environment variables stored in vault.');
  });

  it('shows values when --show-values flag is passed', async () => {
    const mockManager = { listKeys: jest.fn().mockReturnValue(['SECRET']), get: jest.fn().mockReturnValue('abc123') };
    mockLoadEnvManager.mockResolvedValue(mockManager as any);

    await program.parseAsync(['node', 'envault', 'list', '--show-values']);

    expect(mockManager.get).toHaveBeenCalledWith('SECRET');
    expect(consoleLogSpy).toHaveBeenCalledWith('  SECRET=abc123');
  });

  it('exits with error when ENVAULT_PASSWORD is not set', async () => {
    delete process.env.ENVAULT_PASSWORD;

    await expect(program.parseAsync(['node', 'envault', 'list'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ENVAULT_PASSWORD'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when loadEnvManager throws', async () => {
    mockLoadEnvManager.mockRejectedValue(new Error('Decryption failed'));

    await expect(program.parseAsync(['node', 'envault', 'list'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Decryption failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
