import { Command } from 'commander';
import { registerWebhookCommand } from './webhook';
import * as vaultFile from '../../storage/vaultFile';
import * as crypto from '../../crypto/vault';
import { createEmptyWebhookStore, addWebhook } from '../../env/envWebhook';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerWebhookCommand(program);
  return program;
}

const mockPayload = () => ({ entries: {}, webhooks: createEmptyWebhookStore() });

beforeEach(() => {
  jest.spyOn(vaultFile, 'readVault').mockResolvedValue({ data: 'enc', iv: 'iv', salt: 'salt' } as any);
  jest.spyOn(vaultFile, 'writeVault').mockResolvedValue(undefined);
  jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify(mockPayload()));
  jest.spyOn(crypto, 'encrypt').mockResolvedValue({ data: 'enc', iv: 'iv', salt: 'salt' } as any);
  jest.spyOn(require('readline'), 'createInterface').mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb('password'),
    close: jest.fn(),
  });
});

afterEach(() => jest.restoreAllMocks());

describe('webhook add', () => {
  it('registers a new webhook', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'webhook', 'add', 'https://hook.io', '-e', 'set,delete']);
    expect(vaultFile.writeVault).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Webhook registered'));
  });
});

describe('webhook remove', () => {
  it('removes a webhook by id', async () => {
    const store = addWebhook(createEmptyWebhookStore(), 'abc-123', 'https://x.com', ['set']);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify({ entries: {}, webhooks: store }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'webhook', 'remove', 'abc-123']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('removed'));
  });
});

describe('webhook list', () => {
  it('shows no webhooks message when empty', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'webhook', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No webhooks registered.');
  });

  it('lists registered webhooks', async () => {
    const store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://y.com', ['rotate']);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify({ entries: {}, webhooks: store }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'webhook', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('https://y.com'));
  });
});

describe('webhook update', () => {
  it('updates events for an existing webhook', async () => {
    const store = addWebhook(createEmptyWebhookStore(), 'wh2', 'https://z.com', ['set']);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue(JSON.stringify({ entries: {}, webhooks: store }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'webhook', 'update', 'wh2', '-e', 'import']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('updated'));
  });
});
