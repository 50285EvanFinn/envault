# envault

> A CLI tool for securely storing and syncing environment variables across machines using encrypted local vaults.

## Installation

```bash
npm install -g envault
```

## Usage

Initialize a new vault in your project:

```bash
envault init
```

Add and retrieve environment variables:

```bash
# Add a variable to the vault
envault set API_KEY "your-secret-key"

# Get a variable from the vault
envault get API_KEY

# Export all variables to a .env file
envault export > .env

# Sync vault across machines using a passphrase
envault sync --passphrase "your-passphrase"
```

List all stored variables:

```bash
envault list
```

### Example Workflow

```bash
$ envault init
✔ Vault initialized at ~/.envault/default.vault

$ envault set DATABASE_URL "postgres://localhost:5432/mydb"
✔ DATABASE_URL stored securely

$ envault get DATABASE_URL
postgres://localhost:5432/mydb
```

## Configuration

Vaults are stored locally at `~/.envault/` and encrypted using AES-256. A master passphrase is required on first use and cached securely in your system keychain.

## License

[MIT](LICENSE)