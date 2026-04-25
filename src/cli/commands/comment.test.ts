import { Command } from 'commander';
import { registerCommentCommand } from './comment';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import { createEmptyCommentStore, setComment } from '../../env/envComment';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCommentCommand(program);
  return program;
}

const mockPayload = (comments = createEmptyCommentStore()) => ({
  entries: {},
  comments,
});

const mockVaultData = { iv: 'iv', salt: 'salt', data: 'encrypted' };

beforeEach(() => {
  jest.spyOn(vaultFile, 'readVault').mockResolvedValue(mockVaultData);
  jest.spyOn(vaultFile, 'writeVault').mockResolvedValue(undefined);
  jest.spyOn(crypto, 'encrypt').mockResolvedValue(mockVaultData);
  jest.spyOn(require('./comment'), 'promptPassword').mockResolvedValue('secret');
});

afterEach(() => jest.restoreAllMocks());

describe('comment set', () => {
  it('sets a comment and writes the vault', async () => {
    const payload = mockPayload();
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'set', 'API_KEY', 'Used for auth']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('comment get', () => {
  it('prints the comment for a key', async () => {
    const store = setComment(createEmptyCommentStore(), 'DB_URL', 'Database URL');
    const payload = mockPayload(store);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'get', 'DB_URL']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Database URL'));
    spy.mockRestore();
  });

  it('prints not found for missing key', async () => {
    const payload = mockPayload();
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'get', 'MISSING']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No comment found'));
    spy.mockRestore();
  });
});

describe('comment remove', () => {
  it('removes a comment and writes vault', async () => {
    const store = setComment(createEmptyCommentStore(), 'API_KEY', 'some comment');
    const payload = mockPayload(store);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'remove', 'API_KEY']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });
});

describe('comment list', () => {
  it('lists commented keys', async () => {
    let store = createEmptyCommentStore();
    store = setComment(store, 'KEY_A', 'comment a');
    const payload = mockPayload(store);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('KEY_A'));
    spy.mockRestore();
  });

  it('prints no comments message when empty', async () => {
    const payload = mockPayload();
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(payload));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'comment', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No comments found'));
    spy.mockRestore();
  });
});
