# n8n-nodes-nano-rpc

`n8n-nodes-nano-rpc` is an n8n community node package for interacting with a Nano node over RPC.

It includes:

- **Nano RPC node** for on-demand actions (send, receive, account queries, wallet operations, work generation, admin/debug actions)
- **Nano Trigger node** for event-driven workflows via webhook

## Installation

Install this package as an n8n community node. See the official n8n guide:

- [Install community nodes](https://docs.n8n.io/integrations/community-nodes/installation/)

Then add the following nodes in your workflow editor:

- `Nano RPC`
- `Nano Trigger`

## Credentials

Credential type: **Nano API**

### Required

- **RPC URL**: URL of your Nano node RPC endpoint (for example `http://localhost:7076`)

### Optional authentication

- **None**
- **Basic Auth** (`username`, `password`)
- **API Key Header** (`headerName`, `apiKey`)

### Optional defaults

- **Wallet ID**: default wallet for wallet-dependent operations
- **Default Source Account**: default source account for transfer operations

## Supported operations

Operations are grouped by resource.

### Account

- Get balance
- Get account info
- Get account history
- Get account block count
- Get account key / representative / weight
- Validate address
- Multi-account balance/frontier/receivable/representative queries

### Transaction

- Send payment
- Receive pending transaction
- Process block
- Check receivable existence
- Epoch upgrade

### Block

- Confirm block
- Get block info / account / count
- Get blocks / blocks info
- Create block
- Calculate block hash

### Wallet

- Create/destroy wallet
- Create/list/remove/move accounts
- Change/enter/validate wallet password
- Wallet balances/history/info/ledger/frontiers/receivable/work
- Set wallet/account representative
- Set/get account work
- Wallet add/watch/export/lock
- Search receivable (single/all wallets)

### Network

- Node version/id/uptime/telemetry
- Peers and online representatives
- Keepalive, republish, populate backlog
- Available supply

### Ledger

- Get chain/successors/frontiers/frontier count
- Get ledger
- Get unopened

### Confirmation

- Confirmation active/history/info/quorum
- Election statistics

### Work

- Generate/validate work
- Add/list/clear work peers
- Cancel work

### Keys

- Create key pair
- Expand key
- Deterministic key derivation
- Sign

### Administration

- Bootstrap/bootstrapAny/bootstrapLazy
- Get/reset bootstrap state
- Node stats (get/clear)
- Unchecked blocks (get/clear)
- Stop node

### Conversion

- Nano → raw (RPC)
- raw → Nano (RPC)

## Usage notes

- Prefer a trusted/private Nano RPC endpoint for production usage.
- Operations that mutate wallet or node state should only be enabled for trusted workflows/users.
- Wallet IDs, block hashes, work values, and account addresses are validated before sensitive operations.
- RPC calls include timeout and retry handling for transient network failures.

### Runtime options

Under **Options**, the node supports:

- **Timeout (Ms)**: request timeout per RPC call
- **Max Retries**: number of retries for transient failures (timeouts, rate limits, network/server errors)

## Compatibility

- Package is built with the n8n community node tooling (`@n8n/node-cli`).
- Peer dependency: `n8n-workflow` (any version supported by your n8n instance).
- Use a Nano node version that supports the RPC actions you invoke.

## Development

Available scripts:

- `build`
- `dev`
- `lint`
- `lint:fix`
- `release`

## Resources

- [n8n community nodes docs](https://docs.n8n.io/integrations/#community-nodes)
- [Nano RPC protocol docs](https://docs.nano.org/commands/rpc-protocol/)
- [Nano RPC command index](https://docs.nano.org/commands/rpc-protocol/#rpc-commands)

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
