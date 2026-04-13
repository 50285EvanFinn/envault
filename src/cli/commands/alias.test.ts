import { Command } from "commander";
import { registerAliasCommand } from "./alias";
import * as vaultFile from "../../storage/vaultFile";
import * as crypto from "../../crypto/vault";
import { createEmptyAliasStore, setAlias } from "../../env/envAlias";

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return program;
}

const mockVaultData = { data: "enc", iv: "iv", salt: "salt" };

beforeEach(() => {
  jest.spyOn(vaultFile, "readVault").mockResolvedValue(mockVaultData as any);
  jest.spyOn(vaultFile, "writeVault").mockResolvedValue(undefined);
  jest.spyOn(crypto, "encrypt").mockResolvedValue(mockVaultData as any);
});

afterEach(() => jest.restoreAllMocks());

describe("alias set", () => {
  it("sets an alias in the vault", async () => {
    const payload = { entries: {}, aliases: {} };
    jest.spyOn(crypto, "decrypt").mockResolvedValue(JSON.stringify(payload));
    const program = buildProgram();
    const promptSpy = jest.spyOn(require("./alias"), "promptPassword").mockResolvedValue("secret");
    await program.parseAsync(["node", "test", "alias", "set", "db", "DATABASE_URL"]);
    expect(vaultFile.writeVault).toHaveBeenCalled();
    promptSpy.mockRestore();
  });
});

describe("alias remove", () => {
  it("removes an alias from the vault", async () => {
    let store = createEmptyAliasStore();
    store = setAlias(store, "db", "DATABASE_URL");
    const payload = { entries: {}, aliases: store.aliases };
    jest.spyOn(crypto, "decrypt").mockResolvedValue(JSON.stringify(payload));
    const program = buildProgram();
    const promptSpy = jest.spyOn(require("./alias"), "promptPassword").mockResolvedValue("secret");
    await program.parseAsync(["node", "test", "alias", "remove", "db"]);
    expect(vaultFile.writeVault).toHaveBeenCalled();
    promptSpy.mockRestore();
  });
});

describe("alias list", () => {
  it("prints no aliases message when empty", async () => {
    const payload = { entries: {}, aliases: {} };
    jest.spyOn(crypto, "decrypt").mockResolvedValue(JSON.stringify(payload));
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const program = buildProgram();
    const promptSpy = jest.spyOn(require("./alias"), "promptPassword").mockResolvedValue("secret");
    await program.parseAsync(["node", "test", "alias", "list"]);
    expect(consoleSpy).toHaveBeenCalledWith("No aliases defined.");
    consoleSpy.mockRestore();
    promptSpy.mockRestore();
  });

  it("lists aliases", async () => {
    const payload = { entries: {}, aliases: { db: "DATABASE_URL" } };
    jest.spyOn(crypto, "decrypt").mockResolvedValue(JSON.stringify(payload));
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const program = buildProgram();
    const promptSpy = jest.spyOn(require("./alias"), "promptPassword").mockResolvedValue("secret");
    await program.parseAsync(["node", "test", "alias", "list"]);
    expect(consoleSpy).toHaveBeenCalledWith("db -> DATABASE_URL");
    consoleSpy.mockRestore();
    promptSpy.mockRestore();
  });
});
