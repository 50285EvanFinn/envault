import { Command } from 'commander';
import { registerNoteCommand } from './note';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import { createEmptyNoteStore } from '../../env/envNote';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return program;
}

const fakeEncrypted = { iv: 'iv', salt: 'salt', data: 'data' };
const fakePayload = { entries: {}, notes: createEmptyNoteStore() };

beforeEach(() => {
  jest.spyOn(vaultFile, 'readVault').mockResolvedValue(fakeEncrypted as any);
  jest.spyOn(vaultFile, 'writeVault').mockResolvedValue();
  jest.spyOn(crypto, 'decrypt').mockReturnValue(JSON.parse(JSON.stringify(fakePayload)));
  jest.spyOn(crypto, 'encrypt').mockReturnValue(fakeEncrypted as any);
  jest.spyOn(require('./note'), 'promptPassword').mockResolvedValue('secret').mockName('promptPassword');
});

afterEach(() => jest.restoreAllMocks());

describe('note set', () => {
  it('sets a note and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'note', 'set', 'API_KEY', 'Rotate monthly']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('note get', () => {
  it('prints note when found', async () => {
    const payload = { entries: {}, notes: { notes: { API_KEY: { key: 'API_KEY', note: 'hello', updatedAt: '' } } } };
    jest.spyOn(crypto, 'decrypt').mockReturnValue(payload as any);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'note', 'get', 'API_KEY']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('hello'));
    spy.mockRestore();
  });

  it('prints not found message when missing', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'note', 'get', 'MISSING']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No note found'));
    spy.mockRestore();
  });
});

describe('note remove', () => {
  it('removes note and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'note', 'remove', 'API_KEY']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('note list', () => {
  it('prints no notes message when empty', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'note', 'list']);
    expect(spy).toHaveBeenCalledWith('No notes found.');
    spy.mockRestore();
  });
});
