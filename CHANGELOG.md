# Changelog

## [0.1.2](https://github.com/Delkathes/nano-n8n-rpc/compare/0.1.1...0.1.2) (2026-08-31)

### Bug Fixes

* make release tooling work with release-it 20 without GITHUB_AUTH ([a2f7e0d](https://github.com/Delkathes/nano-n8n-rpc/commit/a2f7e0d020b5972ded987d6a2793f05b63929fee))
* ship credential icon in npm package and use release-it 21-compatible release command ([f119ba5](https://github.com/Delkathes/nano-n8n-rpc/commit/f119ba505410372b53c7b30cde56b72b4e409f8c))
* update tsconfig to include node types and remove moduleResolution + new bearer credentials ([3d5f6b8](https://github.com/Delkathes/nano-n8n-rpc/commit/3d5f6b813656158aa61757adbce73849e786593a))

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- RPC resiliency strategy in core calls:
  - request timeout support
  - transient-failure retries
- Additional parameter validators for:
  - private keys
  - work values
  - positive Nano amounts
  - raw amounts
- Node runtime options for:
  - timeout
  - max retries

### Changed

- Improved RPC failure diagnostics with action name, retry/attempt data, and redacted request context.
- Wired Nano node UI options to RPC runtime config so timeout/retry values are applied per item.
- Tightened validation for high-risk operations such as `send`, `receive`, `walletAdd`, `walletDestroy`,
  `accountMove`, `workSet`, `bootstrapLazy`, `cancelWork`, and `searchReceivable`.
- Updated wallet/hash validation to accept both uppercase and lowercase hexadecimal strings.
- Replaced placeholder README with full project documentation.

### Fixed

- `getConfirmationHistory` now correctly allows empty hash input (fetch recent confirmations) and
  validates only when a hash is provided.
- Added missing `startingBlock` hash validation in `getSuccessors`.

## [0.1.0] - 2026-03-14

### Added

- Initial release of `@nano/n8n-nodes-rpc-commands`.
- Nano RPC node with broad support for account, transaction, block, wallet, network, ledger,
  confirmation, work, key, administration, and conversion operations.
- Nano Trigger node for webhook-driven workflows.
