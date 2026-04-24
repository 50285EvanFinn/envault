import { Command } from 'commander';
import { registerTemplateCommand } from './template';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import {
  createEmptyTemplateStore,
  createTemplate,
  addTemplate,
} from '../../env/envTemplate';
import { createEmptyVault } from '../../env/envEntry';

jest.mock('../../storage/vaultFile');
jest.mock('../../crypto/vault');
jest.mock('./template', () => ({
  ...jest.requireActual('./template'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

const mockedRead = vaultFile.readVault as jest.MockedFunction<typeof vaultFile.readVault>;
const mockedWrite = vaultFile.writeVault as jest.MockedFunction<typeof vaultFile.writeVault>;
const mockedDecrypt = crypto.decrypt as jest.MockedFunction<typeof crypto.decrypt>;
const mockedEncrypt = crypto.encrypt as jest.MockedFunction<typeof crypto.encrypt>;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommand(program);
  return program;
}

function makeVaultPayload(extra: object = {}) {
  return JSON.stringify({ ...createEmptyVault(), ...extra });
}

const fakeRaw = { data: 'enc', salt: 'salt', iv: 'iv' };
const fakeEncResult = { data: 'enc2', salt: 'salt2', iv: 'iv2' };

beforeEach(() => {
  jest.clearAllMocks();
  mockedRead.mockResolvedValue(fakeRaw as any);
  mockedEncrypt.mockResolvedValue(fakeEncResult as any);
  mockedWrite.mockResolvedValue(undefined);
});

describe('template list', () => {
  it('prints no templates message when store is empty', async () => {
    mockedDecrypt.mockResolvedValue(makeVaultPayload());
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['template', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('No templates found.');
    spy.mockRestore();
  });

  it('lists templates when present', async () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('base', [{ key: 'X', required: true }], 'desc'));
    mockedDecrypt.mockResolvedValue(makeVaultPayload({ templates: store }));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['template', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('base'));
    spy.mockRestore();
  });
});

describe('template show', () => {
  it('shows template details', async () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('base', [{ key: 'DB_HOST', required: true }]));
    mockedDecrypt.mockResolvedValue(makeVaultPayload({ templates: store }));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['template', 'show', 'base'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('base'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('DB_HOST'));
    spy.mockRestore();
  });

  it('exits with error for missing template', async () => {
    mockedDecrypt.mockResolvedValue(makeVaultPayload());
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['template', 'show', 'ghost'], { from: 'user' })).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('template validate', () => {
  it('passes validation when all required keys exist', async () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('base', [{ key: 'API_KEY', required: true }]));
    const vault = { ...createEmptyVault(), entries: { API_KEY: { key: 'API_KEY', value: 'abc', createdAt: '', updatedAt: '' } }, templates: store };
    mockedDecrypt.mockResolvedValue(JSON.stringify(vault));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['template', 'validate', 'base'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('present'));
    spy.mockRestore();
  });
});

describe('template delete', () => {
  it('deletes an existing template', async () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('base', []));
    mockedDecrypt.mockResolvedValue(makeVaultPayload({ templates: store }));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['template', 'delete', 'base'], { from: 'user' });
    expect(mockedWrite).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('deleted'));
    spy.mockRestore();
  });
});
