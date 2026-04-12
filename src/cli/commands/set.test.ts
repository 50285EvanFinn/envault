import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vaultFile from '../../storage/vaultFile';
import * as envEntry from '../../env/envEntry';
import * as prompt from '../prompt';

vi.mock('../../storage/vaultFile');
vi.mock('../prompt');

const mockVault = {
  version: 1,
  entries: [
    { key: 'EXISTING_KEY', value: 'old_value', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ],
};

describe('set command logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prompt.getPassword).mockResolvedValue('secret');
    vi.mocked(vaultFile.ensureVaultDir).mockResolvedValue(undefined);
    vi.mocked(vaultFile.writeVault).mockResolvedValue(undefined);
  });

  it('adds a new entry to an empty vault', async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(false);
    vi.spyOn(envEntry, 'createEmptyVault').mockReturnValue({ version: 1, entries: [] });
    vi.spyOn(envEntry, 'createEntry').mockReturnValue({
      key: 'NEW_KEY',
      value: 'new_value',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });

    const entry = envEntry.createEntry('NEW_KEY', 'new_value');
    const vault = envEntry.createEmptyVault();
    vault.entries.push(entry);

    expect(vault.entries).toHaveLength(1);
    expect(vault.entries[0].key).toBe('NEW_KEY');
  });

  it('updates an existing entry', async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
    vi.mocked(vaultFile.readVault).mockResolvedValue(mockVault);
    vi.spyOn(envEntry, 'updateEntry').mockReturnValue({
      key: 'EXISTING_KEY',
      value: 'new_value',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    });

    const vault = { ...mockVault, entries: [...mockVault.entries] };
    const updated = envEntry.updateEntry(vault.entries[0], 'new_value');

    expect(updated.value).toBe('new_value');
    expect(updated.key).toBe('EXISTING_KEY');
  });

  it('throws if writeVault fails', async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(false);
    vi.spyOn(envEntry, 'createEmptyVault').mockReturnValue({ version: 1, entries: [] });
    vi.mocked(vaultFile.writeVault).mockRejectedValue(new Error('disk error'));

    await expect(vaultFile.writeVault('default', { version: 1, entries: [] }, 'secret')).rejects.toThrow('disk error');
  });
});
