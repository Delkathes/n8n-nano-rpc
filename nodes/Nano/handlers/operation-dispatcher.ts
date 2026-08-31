import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { createNanoRPC } from '../../../libs/nano-rpc/nano-rpc';

import { nanoToRaw, rawToNano, formatNanoAmount } from '../../../utils/conversions';

import {
	isValidBlockHash,
	isValidNanoAddress,
	isValidPositiveNanoAmount,
	isValidPrivateKey,
	isValidRawAmount,
	isValidWalletId,
	isValidWorkValue,
	validateBlockContents,
	validateSignOptions,
} from '../../../utils/validation';

import type * as rpcTypes from '../../../types';

export async function dispatchNanoOperation(params: {
	executeFunctions: IExecuteFunctions;
	rpc: ReturnType<typeof createNanoRPC>;
	operation: string;
	itemIndex: number;
	credentialsWalletId: string;
	defaultSourceAccount: unknown;
}): Promise<rpcTypes.NanoOperationResponse> {
	const { executeFunctions, rpc, operation, itemIndex, credentialsWalletId, defaultSourceAccount } =
		params;
	const i = itemIndex;

	const parseCsv = (input: string): string[] =>
		input
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value.length > 0);

	return async function (this: IExecuteFunctions): Promise<rpcTypes.NanoOperationResponse> {
		let responseData: rpcTypes.NanoOperationResponse;

		switch (operation) {
			case 'send': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const destination = this.getNodeParameter('destination', i) as string;
				const amount = this.getNodeParameter('amount', i) as string;
				const sourceAccount = this.getNodeParameter(
					'sourceAccount',
					i,
					defaultSourceAccount,
				) as string;
				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}
				const sendId = this.getNodeParameter('sendId', i, '') as string;
				const sendWork = this.getNodeParameter('sendWork', i, '') as string;

				if (!isValidNanoAddress(destination)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid destination address: ${destination}`,
						{ itemIndex: i },
					);
				}

				if (!isValidNanoAddress(sourceAccount)) {
					throw new NodeOperationError(this.getNode(), `Invalid source address: ${sourceAccount}`, {
						itemIndex: i,
					});
				}

				if (!isValidPositiveNanoAmount(amount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Amount must be a positive decimal string with up to 30 decimal places: ${amount}`,
						{
							itemIndex: i,
						},
					);
				}

				if (sendWork && !isValidWorkValue(sendWork)) {
					throw new NodeOperationError(this.getNode(), `Invalid work value: ${sendWork}`, {
						itemIndex: i,
					});
				}

				const amountRaw = nanoToRaw(amount);

				const { block: blockHash } = await rpc.send(
					walletId,
					sourceAccount,
					destination,
					amountRaw,
					sendId || undefined,
					sendWork || undefined,
				);

				responseData = {
					success: true,
					blockHash,
					destination,
					amount,
					amountRaw,
					source: sourceAccount,
					id: sendId || undefined,
					timestamp: new Date().toISOString(),
				};
				break;
			}

			case 'balance': {
				const account = this.getNodeParameter('account', i) as string;
				const includeOnlyConfirmed = this.getNodeParameter(
					'balanceIncludeOnlyConfirmed',
					i,
					true,
				) as boolean;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const balanceData = await rpc.getBalance(account, includeOnlyConfirmed);

				responseData = {
					account,
					balance: rawToNano(balanceData.balance),
					balanceRaw: balanceData.balance,
					pending: rawToNano(balanceData.pending),
					pendingRaw: balanceData.pending,
					receivable: rawToNano(balanceData.receivable),
					receivableRaw: balanceData.receivable,
					balanceFormatted: formatNanoAmount(balanceData.balance),
					pendingFormatted: formatNanoAmount(balanceData.pending),
				};
				break;
			}

			case 'accountInfo': {
				const account = this.getNodeParameter('account', i) as string;
				const includeRepresentative = this.getNodeParameter(
					'accountInfoRepresentative',
					i,
					true,
				) as boolean;
				const includeWeight = this.getNodeParameter('accountInfoWeight', i, true) as boolean;
				const includePending = this.getNodeParameter('accountInfoPending', i, true) as boolean;
				const includeConfirmed = this.getNodeParameter(
					'accountInfoIncludeConfirmed',
					i,
					false,
				) as boolean;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const accountInfo = await rpc.getAccountInfo(account, {
					representative: includeRepresentative,
					weight: includeWeight,
					pending: includePending,
					receivable: includePending,
					includeConfirmed: includeConfirmed || undefined,
				});

				responseData = {
					frontier: accountInfo.frontier,
					openBlock: accountInfo.open_block,
					representativeBlock: accountInfo.representative_block,
					account,
					balance: rawToNano(accountInfo.balance),
					balanceRaw: accountInfo.balance,
					blockCount: accountInfo.block_count,
					...(accountInfo.representative && { representative: accountInfo.representative }),
					...(accountInfo.weight && { weight: accountInfo.weight }),
					...(accountInfo.pending && {
						pending: rawToNano(accountInfo.pending),
						pendingRaw: accountInfo.pending,
					}),
					...(accountInfo.receivable && {
						receivable: rawToNano(accountInfo.receivable),
						receivableRaw: accountInfo.receivable,
					}),
					...(accountInfo.confirmed_balance && {
						confirmedBalance: rawToNano(accountInfo.confirmed_balance),
						confirmedBalanceRaw: accountInfo.confirmed_balance,
					}),
					...(accountInfo.confirmed_height && { confirmedHeight: accountInfo.confirmed_height }),
					...(accountInfo.confirmed_frontier && {
						confirmedFrontier: accountInfo.confirmed_frontier,
					}),
					...(accountInfo.confirmed_representative && {
						confirmedRepresentative: accountInfo.confirmed_representative,
					}),
					...(accountInfo.confirmed_receivable && {
						confirmedReceivable: rawToNano(accountInfo.confirmed_receivable),
						confirmedReceivableRaw: accountInfo.confirmed_receivable,
					}),
				};
				break;
			}

			case 'history': {
				const account = this.getNodeParameter('account', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;
				const head = this.getNodeParameter('historyHead', i, '') as string;
				const offset = this.getNodeParameter('historyOffset', i, 0) as number;
				const reverse = this.getNodeParameter('historyReverse', i, false) as boolean;
				const accountFilterStr = this.getNodeParameter('historyAccountFilter', i, '') as string;
				const includeLinkedAccount = this.getNodeParameter(
					'historyIncludeLinkedAccount',
					i,
					false,
				) as boolean;
				const raw = this.getNodeParameter('historyRaw', i, true) as boolean;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const accountFilter = accountFilterStr
					? accountFilterStr
							.split(',')
							.map((a) => a.trim())
							.filter((a) => a)
					: undefined;

				const historyOptions = {
					...(raw === false && { raw: false }),
					...(head && { head }),
					...(offset > 0 && { offset }),
					...(reverse && { reverse }),
					...(accountFilter && accountFilter.length > 0 && { accountFilter }),
					...(includeLinkedAccount && { includeLinkedAccount }),
				};

				const historyData = await rpc.getAccountHistory(
					account,
					count,
					Object.keys(historyOptions).length > 0 ? historyOptions : undefined,
				);

				const formattedHistory =
					historyData.history?.map((tx) => ({
						type: tx.type,
						subtype: tx.subtype,
						account: tx.account,
						amount: rawToNano(tx.amount),
						amountRaw: tx.amount,
						hash: tx.hash,
						height: tx.height,
						confirmed: tx.confirmed === 'true',
						localTimestamp: tx.local_timestamp
							? new Date(parseInt(tx.local_timestamp) * 1000).toISOString()
							: undefined,
						...(tx.previous && { previous: tx.previous }),
						...(tx.representative && { representative: tx.representative }),
						...(tx.balance && { balance: tx.balance }),
						...(tx.link && { link: tx.link }),
						...(tx.link_as_account && { linkAsAccount: tx.link_as_account }),
						...(tx.signature && { signature: tx.signature }),
						...(tx.work && { work: tx.work }),
						...(tx.linked_account && { linkedAccount: tx.linked_account }),
					})) || [];

				responseData = {
					account,
					history: formattedHistory,
					...(historyData.previous && { previous: historyData.previous }),
					...(historyData.next && { next: historyData.next }),
				};
				break;
			}

			case 'accountBlockCount': {
				const account = this.getNodeParameter('account', i) as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { block_count } = await rpc.getAccountBlockCount(account);

				responseData = {
					account,
					blockCount: parseInt(block_count),
				};
				break;
			}

			case 'accountKey': {
				const account = this.getNodeParameter('account', i) as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { key: publicKey } = await rpc.getAccountKey(account);

				responseData = {
					account,
					publicKey,
				};
				break;
			}

			case 'accountRepresentative': {
				const account = this.getNodeParameter('account', i) as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { representative } = await rpc.getAccountRepresentative(account);

				responseData = {
					account,
					representative,
				};
				break;
			}

			case 'accountWeight': {
				const account = this.getNodeParameter('account', i) as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { weight } = await rpc.getAccountWeight(account);

				responseData = {
					account,
					weight,
					weightFormatted: formatNanoAmount(weight),
				};
				break;
			}

			case 'receivable': {
				const account = this.getNodeParameter('account', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;
				const threshold = this.getNodeParameter('threshold', i, '') as string;
				const source = this.getNodeParameter('receivableSource', i, true) as boolean;
				const includeActive = this.getNodeParameter('receivableIncludeActive', i, false) as boolean;
				const minVersion = this.getNodeParameter('receivableMinVersion', i, false) as boolean;
				const sorting = this.getNodeParameter('receivableSorting', i, false) as boolean;
				const includeOnlyConfirmed = this.getNodeParameter(
					'receivableIncludeOnlyConfirmed',
					i,
					true,
				) as boolean;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const receivableOptions = {
					count,
					...(threshold && { threshold }),
					...(source && { source }),
					...(includeActive && { includeActive }),
					...(minVersion && { minVersion }),
					...(sorting && { sorting }),
					...(!includeOnlyConfirmed && { includeOnlyConfirmed: false }),
				};

				const { blocks } = await rpc.getReceivable(account, receivableOptions);

				responseData = {
					account,
					receivable: blocks,
				};
				break;
			}

			case 'blockAccount': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const { account } = await rpc.getBlockAccount(blockHash);

				responseData = {
					blockHash,
					account,
				};
				break;
			}

			case 'blockCount': {
				const blockCountData = await rpc.getBlockCount();

				responseData = {
					count: blockCountData.count,
					unchecked: blockCountData.unchecked,
					cemented: blockCountData.cemented,
				};
				break;
			}

			case 'processBlock': {
				const blockJsonRaw = this.getNodeParameter('blockJson', i);
				const blockJson =
					typeof blockJsonRaw === 'string' ? JSON.parse(blockJsonRaw) : blockJsonRaw;

				const blockErrors = validateBlockContents(blockJson);
				if (blockErrors.length > 0) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid block JSON: ${blockErrors.join('; ')}`,
						{ itemIndex: i },
					);
				}

				const subtype = this.getNodeParameter('subtype', i, 'send') as rpcTypes.BlockSubtype;
				const force = this.getNodeParameter('processForce', i, false) as boolean;
				const asyncProcess = this.getNodeParameter('processAsync', i, false) as boolean;

				const processOptions = {
					subtype,
					...(force && { force }),
					...(asyncProcess && { async: true }),
				};

				const result = await rpc.process(blockJson, processOptions);

				responseData = {
					success: true,
					...(result.hash && { hash: result.hash }),
					...(result.started && { started: result.started === '1' }),
					subtype,
					async: asyncProcess,
				};
				break;
			}

			case 'version': {
				const versionInfo = await rpc.getVersion();

				responseData = {
					...versionInfo,
				};
				break;
			}

			case 'representativesOnline': {
				const includeWeight = this.getNodeParameter('includeWeight', i, false) as boolean;
				const filterAccountsStr = this.getNodeParameter('filterAccounts', i, '') as string;
				const filterAccounts = filterAccountsStr
					? filterAccountsStr
							.split(',')
							.map((a) => a.trim())
							.filter((a) => a.length > 0)
					: undefined;

				const { representatives } = await rpc.getRepresentativesOnline({
					weight: includeWeight || undefined,
					accounts: filterAccounts,
				});

				responseData = {
					representatives,
				};
				break;
			}

			case 'delegators': {
				const account = this.getNodeParameter('account', i) as string;
				const threshold = this.getNodeParameter('delegatorsThreshold', i, '') as string;
				const countParam = this.getNodeParameter('delegatorsCount', i, 0) as number;
				const start = this.getNodeParameter('delegatorsStart', i, '') as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const options: { threshold?: string; count?: number; start?: string } = {};
				if (threshold) options.threshold = threshold;
				if (countParam > 0) options.count = countParam;
				if (start) options.start = start;

				const { delegators } = await rpc.getDelegators(
					account,
					Object.keys(options).length > 0 ? options : undefined,
				);

				responseData = {
					account,
					delegators,
					delegatorCount: Object.keys(delegators).length,
				};
				break;
			}

			case 'delegatorsCount': {
				const account = this.getNodeParameter('account', i) as string;

				if (!isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { count } = await rpc.getDelegatorsCount(account);

				responseData = {
					account,
					delegatorCount: parseInt(count),
				};
				break;
			}

			case 'receive': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const receivingAccount = this.getNodeParameter('receivingAccount', i) as string;
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const work = this.getNodeParameter('receiveWork', i, '') as string;

				if (!isValidWalletId(manualWalletId.length > 0 ? manualWalletId : credentialsWalletId)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid wallet ID: ${manualWalletId.length > 0 ? manualWalletId : credentialsWalletId}`,
						{ itemIndex: i },
					);
				}

				if (!isValidNanoAddress(receivingAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid receiving account address: ${receivingAccount}`,
						{ itemIndex: i },
					);
				}

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				if (work && !isValidWorkValue(work)) {
					throw new NodeOperationError(this.getNode(), `Invalid work value: ${work}`, {
						itemIndex: i,
					});
				}

				const { block: receiveBlockHash } = await rpc.receive(
					manualWalletId.length > 0 ? manualWalletId : credentialsWalletId,
					receivingAccount,
					blockHash,
					work || undefined,
				);

				responseData = {
					success: true,
					receivingAccount,
					receivedBlockHash: receiveBlockHash,
					originalBlockHash: blockHash,
					timestamp: new Date().toISOString(),
				};
				break;
			}

			case 'validate': {
				const addressToValidate = this.getNodeParameter('addressToValidate', i) as string;

				const { valid } = await rpc.validateAccount(addressToValidate);

				responseData = {
					address: addressToValidate,
					valid: valid === '1',
				};
				break;
			}

			case 'blockInfo': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const jsonBlock = this.getNodeParameter('jsonBlock', i, true) as boolean;
				const includeLinkedAccount = this.getNodeParameter(
					'includeLinkedAccount',
					i,
					false,
				) as boolean;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const blockInfo = await rpc.getBlockInfo(blockHash, jsonBlock, includeLinkedAccount);

				responseData = {
					hash: blockHash,
					...blockInfo,
					amount: blockInfo.amount ? rawToNano(blockInfo.amount) : undefined,
					balance: blockInfo.balance ? rawToNano(blockInfo.balance) : undefined,
				};
				break;
			}

			case 'createAccount': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const accountIndex = this.getNodeParameter('accountIndex', i, -1) as number;
				const createAccountWork = this.getNodeParameter('createAccountWork', i, true) as boolean;

				const createOptions: { index?: number; work?: boolean } = {};
				if (accountIndex >= 0) {
					createOptions.index = accountIndex;
				}
				if (!createAccountWork) {
					createOptions.work = false;
				}

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { account: newAccount } = await rpc.createAccount(walletId, createOptions);

				responseData = {
					success: true,
					account: newAccount,
					wallet: walletId,
					...(accountIndex >= 0 && { index: accountIndex }),
					workGenerated: createAccountWork,
					timestamp: new Date().toISOString(),
				};
				break;
			}

			case 'listAccounts': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { accounts } = await rpc.listAccounts(walletId);

				responseData = {
					wallet: walletId,
					accountCount: accounts.length,
					accounts,
				};
				break;
			}

			case 'accountMove': {
				const sourceWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const targetWallet = this.getNodeParameter('targetWallet', i) as string;
				const accountsToMoveStr = this.getNodeParameter('accountsToMove', i) as string;
				const accountsToMove = parseCsv(accountsToMoveStr);

				const walletId = sourceWalletId.length > 0 ? sourceWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidWalletId(targetWallet)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid target wallet ID: ${targetWallet}`,
						{
							itemIndex: i,
						},
					);
				}

				if (accountsToMove.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one account is required for accountMove',
						{ itemIndex: i },
					);
				}

				for (const account of accountsToMove) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const { moved } = await rpc.accountMove(walletId, targetWallet, accountsToMove);

				responseData = {
					success: true,
					moved: parseInt(moved),
				};
				break;
			}

			case 'accountRemove': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const accountToRemove = this.getNodeParameter('accountToRemove', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidNanoAddress(accountToRemove)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${accountToRemove}`,
						{ itemIndex: i },
					);
				}

				const { removed } = await rpc.accountRemove(walletId, accountToRemove);

				responseData = {
					success: true,
					removed: removed === '1',
				};
				break;
			}

			case 'accountRepresentativeSet': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletAccount = this.getNodeParameter('walletAccount', i) as string;
				const representativeAddress = this.getNodeParameter('representativeAddress', i) as string;
				const accountRepSetWork = this.getNodeParameter('accountRepSetWork', i, '') as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidNanoAddress(walletAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${walletAccount}`,
						{ itemIndex: i },
					);
				}

				if (!isValidNanoAddress(representativeAddress)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid representative address: ${representativeAddress}`,
						{ itemIndex: i },
					);
				}

				const { block } = await rpc.accountRepresentativeSet(
					walletId,
					walletAccount,
					representativeAddress,
					accountRepSetWork ? { work: accountRepSetWork } : undefined,
				);

				responseData = {
					success: true,
					block,
				};
				break;
			}

			case 'accountsCreate': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const accountCount = this.getNodeParameter('accountCount', i) as number;
				const accountsCreateWork = this.getNodeParameter('accountsCreateWork', i, false) as boolean;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { accounts } = await rpc.accountsCreate(walletId, accountCount, {
					work: accountsCreateWork,
				});

				responseData = {
					success: true,
					accounts,
				};
				break;
			}

			case 'passwordChange': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletPassword = this.getNodeParameter('walletPassword', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { changed } = await rpc.passwordChange(walletId, walletPassword);

				responseData = {
					success: true,
					changed: changed === '1',
				};
				break;
			}

			case 'passwordEnter': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletPassword = this.getNodeParameter('walletPassword', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { valid } = await rpc.passwordEnter(walletId, walletPassword);

				responseData = {
					success: true,
					valid: valid === '1',
				};
				break;
			}

			case 'passwordValid': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { valid } = await rpc.passwordValid(walletId);

				responseData = {
					valid: valid === '1',
				};
				break;
			}

			case 'receiveMinimum': {
				const { amount } = await rpc.receiveMinimum();

				responseData = {
					amount,
					amountFormatted: formatNanoAmount(amount),
				};
				break;
			}

			case 'receiveMinimumSet': {
				const minimumAmount = this.getNodeParameter('minimumAmount', i) as string;

				if (!isValidRawAmount(minimumAmount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid minimum raw amount: ${minimumAmount}`,
						{ itemIndex: i },
					);
				}

				const { success } = await rpc.receiveMinimumSet(minimumAmount);

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'searchReceivable': {
				const searchWallet = this.getNodeParameter('searchWallet', i) as string;

				if (!isValidWalletId(searchWallet)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${searchWallet}`, {
						itemIndex: i,
					});
				}

				const { started } = await rpc.searchReceivable(searchWallet);

				responseData = {
					success: true,
					started: started === '1',
				};
				break;
			}

			case 'searchReceivableAll': {
				const { started } = await rpc.searchReceivableAll();

				responseData = {
					success: started === '1',
				};
				break;
			}

			case 'walletAdd': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletPrivateKey = this.getNodeParameter('walletPrivateKey', i) as string;
				const walletAddDisableWork = this.getNodeParameter(
					'walletAddDisableWork',
					i,
					false,
				) as boolean;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidPrivateKey(walletPrivateKey)) {
					throw new NodeOperationError(
						this.getNode(),
						'walletPrivateKey must be a 64-character hexadecimal string',
						{ itemIndex: i },
					);
				}

				const { account } = await rpc.walletAdd(
					walletId,
					walletPrivateKey,
					walletAddDisableWork ? { work: false } : undefined,
				);

				responseData = {
					success: true,
					account,
				};
				break;
			}

			case 'walletAddWatch': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const watchAccountsStr = this.getNodeParameter('watchAccounts', i) as string;
				const watchAccounts = watchAccountsStr.split(',').map((a) => a.trim());

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				for (const account of watchAccounts) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const { success } = await rpc.walletAddWatch(walletId, watchAccounts);

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'walletBalances': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const balanceThreshold = this.getNodeParameter('balanceThreshold', i, '') as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { balances } = await rpc.walletBalances(walletId, balanceThreshold || undefined);

				responseData = {
					wallet: walletId,
					balances,
				};
				break;
			}

			case 'walletChangeSeed': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const newSeed = this.getNodeParameter('newSeed', i) as string;
				const restoreCount = this.getNodeParameter('restoreCount', i, 0) as number;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const result = await rpc.walletChangeSeed(walletId, newSeed, restoreCount || undefined);

				responseData = {
					success: result.success === '',
					lastRestoredAccount: result.last_restored_account,
					restoredCount: parseInt(result.restored_count || '0'),
				};
				break;
			}

			case 'walletContains': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletAccount = this.getNodeParameter('walletAccount', i) as string;

				if (!isValidNanoAddress(walletAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${walletAccount}`,
						{ itemIndex: i },
					);
				}

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { exists } = await rpc.walletContains(walletId, walletAccount);

				responseData = {
					wallet: walletId,
					account: walletAccount,
					exists: exists === '1',
				};
				break;
			}

			case 'walletCreate': {
				const initialSeed = this.getNodeParameter('initialSeed', i, '') as string;

				const result = await rpc.walletCreate(initialSeed || undefined);

				responseData = {
					success: true,
					wallet: result.wallet,
					lastRestoredAccount: result.last_restored_account,
					restoredCount: result.restored_count ? parseInt(result.restored_count) : undefined,
				};
				break;
			}

			case 'walletDestroy': {
				const walletToDestroy = this.getNodeParameter('walletToDestroy', i) as string;

				if (!isValidWalletId(walletToDestroy)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletToDestroy}`, {
						itemIndex: i,
					});
				}

				const { destroyed } = await rpc.walletDestroy(walletToDestroy);

				responseData = {
					success: true,
					destroyed: destroyed === '1',
				};
				break;
			}

			case 'walletExport': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { json } = await rpc.walletExport(walletId);

				responseData = {
					wallet: walletId,
					json,
				};
				break;
			}

			case 'walletFrontiers': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { frontiers } = await rpc.walletFrontiers(walletId);

				responseData = {
					wallet: walletId,
					frontiers,
				};
				break;
			}

			case 'walletHistory': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const modifiedSince = this.getNodeParameter('modifiedSince', i, 0) as number;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { history } = await rpc.walletHistory(walletId, modifiedSince || undefined);

				responseData = {
					wallet: walletId,
					history,
				};
				break;
			}

			case 'walletInfo': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const {
					accounts_block_count,
					accounts_cemented_block_count,
					accounts_count,
					adhoc_count,
					balance,
					deterministic_count,
					deterministic_index,
					pending,
					receivable,
				} = await rpc.walletInfo(walletId);

				responseData = {
					wallet: walletId,
					balance,
					pending,
					receivable,
					accountsCount: Number(accounts_count),
					adhocCount: Number(adhoc_count),
					deterministicCount: Number(deterministic_count),
					deterministicIndex: Number(deterministic_index),
					accountsBlockCount: Number(accounts_block_count),
					accountsCementedBlockCount: Number(accounts_cemented_block_count),
				};
				break;
			}

			case 'walletLedger': {
				const includeRepresentative = this.getNodeParameter(
					'includeRepresentative',
					i,
					false,
				) as boolean;
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const includeWeight = this.getNodeParameter('includeWeight', i, false) as boolean;
				const includeReceivable = this.getNodeParameter('includeReceivable', i, false) as boolean;
				const modifiedSince = this.getNodeParameter('modifiedSince', i, 0) as number;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { accounts } = await rpc.walletLedger(walletId, {
					representative: includeRepresentative || undefined,
					weight: includeWeight || undefined,
					receivable: includeReceivable || undefined,
					modifiedSince: modifiedSince || undefined,
				});

				responseData = {
					wallet: walletId,
					accounts,
				};
				break;
			}

			case 'walletLock': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { locked } = await rpc.walletLock(walletId);

				responseData = {
					success: true,
					locked: locked === '1',
				};
				break;
			}

			case 'walletLocked': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { locked } = await rpc.walletLocked(walletId);

				responseData = {
					wallet: walletId,
					locked: locked === '1',
				};
				break;
			}

			case 'walletReceivable': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;
				const balanceThreshold = this.getNodeParameter('balanceThreshold', i, '') as string;
				const includeSource = this.getNodeParameter('includeSource', i, true) as boolean;
				const includeActive = this.getNodeParameter(
					'walletReceivableIncludeActive',
					i,
					false,
				) as boolean;
				const includeOnlyConfirmed = this.getNodeParameter(
					'walletReceivableIncludeOnlyConfirmed',
					i,
					true,
				) as boolean;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { blocks } = await rpc.walletReceivable(walletId, {
					count,
					threshold: balanceThreshold || undefined,
					source: includeSource,
					includeActive,
					includeOnlyConfirmed,
				});

				responseData = {
					wallet: walletId,
					blocks,
				};
				break;
			}

			case 'walletRepresentative': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { representative } = await rpc.walletRepresentative(walletId);

				responseData = {
					wallet: walletId,
					representative,
				};
				break;
			}

			case 'walletRepresentativeSet': {
				const representativeAddress = this.getNodeParameter('representativeAddress', i) as string;
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const updateExisting = this.getNodeParameter('updateExisting', i, true) as boolean;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidNanoAddress(representativeAddress)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid representative address: ${representativeAddress}`,
						{ itemIndex: i },
					);
				}

				const { set } = await rpc.walletRepresentativeSet(
					walletId,
					representativeAddress,
					updateExisting,
				);

				responseData = {
					success: true,
					set: set === '1',
				};
				break;
			}

			case 'walletRepublish': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const republishCount = this.getNodeParameter('republishCount', i, 1) as number;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { blocks } = await rpc.walletRepublish(walletId, republishCount);

				responseData = {
					success: true,
					blocks,
				};
				break;
			}

			case 'walletWorkGet': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				const { works } = await rpc.walletWorkGet(walletId);

				responseData = {
					wallet: walletId,
					works,
				};
				break;
			}

			case 'workGet': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletAccount = this.getNodeParameter('walletAccount', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidNanoAddress(walletAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${walletAccount}`,
						{ itemIndex: i },
					);
				}

				const { work } = await rpc.workGet(walletId, walletAccount);

				responseData = {
					wallet: walletId,
					account: walletAccount,
					work,
				};
				break;
			}

			case 'workSet': {
				const manualWalletId = this.getNodeParameter('manualWalletId', i) as string;
				const walletAccount = this.getNodeParameter('walletAccount', i) as string;
				const workValue = this.getNodeParameter('workValue', i) as string;

				const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;

				if (!isValidWalletId(walletId)) {
					throw new NodeOperationError(this.getNode(), `Invalid wallet ID: ${walletId}`, {
						itemIndex: i,
					});
				}

				if (!isValidNanoAddress(walletAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${walletAccount}`,
						{ itemIndex: i },
					);
				}

				if (!isValidWorkValue(workValue)) {
					throw new NodeOperationError(this.getNode(), `Invalid work value: ${workValue}`, {
						itemIndex: i,
					});
				}

				const { success } = await rpc.workSet(walletId, walletAccount, workValue);

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'confirmBlock': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const { started } = await rpc.confirmBlock(blockHash);

				responseData = {
					success: started === '1',
				};
				break;
			}

			case 'getBlocks': {
				const blockHashesStr = this.getNodeParameter('blockHashes', i) as string;
				const blockHashes = blockHashesStr.split(',').map((h) => h.trim());

				for (const hash of blockHashes) {
					if (!isValidBlockHash(hash)) {
						throw new NodeOperationError(this.getNode(), `Invalid block hash: ${hash}`, {
							itemIndex: i,
						});
					}
				}

				const { blocks } = await rpc.getBlocks(blockHashes);

				responseData = {
					blocks,
				};
				break;
			}

			case 'getBlocksInfo': {
				const blockHashesStr = this.getNodeParameter('blockHashes', i) as string;
				const blockHashes = blockHashesStr.split(',').map((h) => h.trim());
				const includeNotFound = this.getNodeParameter(
					'blocksInfoIncludeNotFound',
					i,
					false,
				) as boolean;
				const includePending = this.getNodeParameter('blocksInfoPending', i, false) as boolean;
				const includeSource = this.getNodeParameter('blocksInfoSource', i, false) as boolean;
				const includeReceiveHash = this.getNodeParameter(
					'blocksInfoReceiveHash',
					i,
					false,
				) as boolean;
				const includeLinkedAccount = this.getNodeParameter(
					'blocksInfoIncludeLinkedAccount',
					i,
					false,
				) as boolean;

				for (const hash of blockHashes) {
					if (!isValidBlockHash(hash)) {
						throw new NodeOperationError(this.getNode(), `Invalid block hash: ${hash}`, {
							itemIndex: i,
						});
					}
				}

				const blocksInfoOptions = {
					...(includeNotFound && { includeNotFound }),
					...(includePending && { pending: true }),
					...(includeSource && { source: true }),
					...(includeReceiveHash && { receiveHash: true }),
					...(includeLinkedAccount && { includeLinkedAccount }),
				};

				const blocksInfoResult = await rpc.getBlocksInfo(
					blockHashes,
					Object.keys(blocksInfoOptions).length > 0 ? blocksInfoOptions : undefined,
				);

				responseData = {
					blocks: blocksInfoResult.blocks,
					...(blocksInfoResult.blocks_not_found && {
						blocksNotFound: blocksInfoResult.blocks_not_found,
					}),
				};
				break;
			}

			case 'receivableExists': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const includeActive = this.getNodeParameter(
					'receiveExistsIncludeActive',
					i,
					false,
				) as boolean;
				const includeOnlyConfirmed = this.getNodeParameter(
					'receiveExistsIncludeOnlyConfirmed',
					i,
					true,
				) as boolean;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const options: rpcTypes.ReceivableExistsOptions = {};
				if (includeActive) options.includeActive = true;
				if (!includeOnlyConfirmed) options.includeOnlyConfirmed = false;

				const { exists } = await rpc.receivableExists(
					blockHash,
					Object.keys(options).length > 0 ? options : undefined,
				);

				responseData = {
					hash: blockHash,
					exists: exists === '1',
				};
				break;
			}

			case 'getChain': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;
				const offset = this.getNodeParameter('chainOffset', i, 0) as number;
				const reverse = this.getNodeParameter('chainReverse', i, false) as boolean;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const options: { offset?: number; reverse?: boolean } = {};
				if (offset > 0) options.offset = offset;
				if (reverse) options.reverse = true;

				const { blocks: chain } = await rpc.getChain(
					blockHash,
					count,
					Object.keys(options).length > 0 ? options : undefined,
				);

				responseData = {
					startingBlock: blockHash,
					chain,
				};
				break;
			}

			case 'getLedger': {
				const startingAccount = this.getNodeParameter('startingAccount', i) as string;
				const count = this.getNodeParameter('ledgerCount', i, 10) as number;
				const representative = this.getNodeParameter('ledgerRepresentative', i, false) as boolean;
				const weight = this.getNodeParameter('ledgerWeight', i, false) as boolean;
				const receivable = this.getNodeParameter('ledgerReceivable', i, false) as boolean;
				const modifiedSince = this.getNodeParameter('ledgerModifiedSince', i, 0) as number;
				const sorting = this.getNodeParameter('ledgerSorting', i, false) as boolean;
				const threshold = this.getNodeParameter('ledgerThreshold', i, '') as string;

				if (!isValidNanoAddress(startingAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${startingAccount}`,
						{ itemIndex: i },
					);
				}

				const ledger = await rpc.getLedger(startingAccount, {
					count,
					representative,
					weight,
					receivable,
					modifiedSince,
					sorting,
					threshold: threshold || undefined,
				});

				responseData = {
					startingAccount,
					accounts: ledger.accounts,
				};
				break;
			}

			case 'getFrontiers': {
				const startingAccount = this.getNodeParameter('startingAccount', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;

				if (!isValidNanoAddress(startingAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${startingAccount}`,
						{ itemIndex: i },
					);
				}

				const { frontiers } = await rpc.getFrontiers(startingAccount, count);

				responseData = {
					startingAccount,
					frontiers,
				};
				break;
			}

			case 'getConfirmationInfo': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const includeRepresentatives = this.getNodeParameter(
					'includeRepresentatives',
					i,
					false,
				) as boolean;
				const includeContents = this.getNodeParameter('includeContents', i, true) as boolean;
				const jsonBlock = this.getNodeParameter('confirmationJsonBlock', i, true) as boolean;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const confirmationInfo = await rpc.getConfirmationInfo(blockHash, {
					representatives: includeRepresentatives,
					contents: includeContents,
					json_block: jsonBlock,
				});

				responseData = {
					hash: blockHash,
					...confirmationInfo,
				};
				break;
			}

			case 'generateWork': {
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const difficulty = this.getNodeParameter('difficulty', i, '') as string;
				const multiplier = this.getNodeParameter('workMultiplier', i, 0) as number;
				const usePeers = this.getNodeParameter('usePeers', i, false) as boolean;
				const workAccount = this.getNodeParameter('workAccount', i, '') as string;
				const workVersion = this.getNodeParameter('workVersion', i, '') as string;
				const workBlockJson = this.getNodeParameter('workBlock', i, '') as string;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const options: Record<string, unknown> = {};
				if (difficulty) {
					options.difficulty = difficulty;
				}
				if (multiplier && multiplier > 0) {
					options.multiplier = multiplier;
				}
				if (usePeers) {
					options.usePeers = true;
					if (workAccount) {
						options.account = workAccount;
					}
				}
				if (workVersion) {
					options.version = workVersion;
				}
				if (workBlockJson) {
					let parsed: unknown;
					try {
						parsed = typeof workBlockJson === 'string' ? JSON.parse(workBlockJson) : workBlockJson;
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON in Block field', {
							itemIndex: i,
						});
					}
					const blockErrors = validateBlockContents(parsed);
					if (blockErrors.length > 0) {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid block JSON: ${blockErrors.join('; ')}`,
							{ itemIndex: i },
						);
					}
					options.block = parsed;
				}

				const workResult = await rpc.generateWork(blockHash, options);

				responseData = {
					hash: workResult.hash,
					work: workResult.work,
					difficulty: workResult.difficulty,
					multiplier: workResult.multiplier,
				};
				break;
			}

			case 'validateWork': {
				const work = this.getNodeParameter('work', i) as string;
				const blockHash = this.getNodeParameter('blockHash', i) as string;
				const difficulty = this.getNodeParameter('difficulty', i, '') as string;
				const multiplier = this.getNodeParameter('workMultiplier', i, 0) as number;
				const version = this.getNodeParameter('workVersion', i, '') as string;

				if (!isValidBlockHash(blockHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${blockHash}`, {
						itemIndex: i,
					});
				}

				const validationResult = await rpc.validateWork(work, blockHash, {
					difficulty: difficulty || undefined,
					multiplier: multiplier > 0 ? multiplier : undefined,
					version: version || undefined,
				});

				responseData = {
					work,
					hash: blockHash,
					valid: validationResult.valid !== undefined ? validationResult.valid === '1' : undefined,
					validAll: validationResult.valid_all === '1',
					validReceive: validationResult.valid_receive === '1',
					difficulty: validationResult.difficulty,
					multiplier: parseFloat(validationResult.multiplier),
				};
				break;
			}

			case 'createKey': {
				const keyPair = await rpc.createKey();

				responseData = {
					success: true,
					...keyPair,
				};
				break;
			}

			case 'signBlock': {
				const signMethod = this.getNodeParameter('signMethod', i, 'key') as string;
				const signInput = this.getNodeParameter('signInput', i, 'block') as string;

				const signOptions: Record<string, unknown> = {};

				if (signMethod === 'key') {
					const signPrivateKey = this.getNodeParameter('signPrivateKey', i) as string;
					signOptions.key = signPrivateKey;
				} else {
					const manualWalletId = this.getNodeParameter('manualWalletId', i, '') as string;
					const walletId = manualWalletId.length > 0 ? manualWalletId : credentialsWalletId;
					signOptions.wallet = walletId;
					const signAccount = this.getNodeParameter('signAccount', i) as string;
					signOptions.account = signAccount;
				}

				if (signInput === 'block') {
					const signBlockJson = this.getNodeParameter('signBlock', i);
					let parsed: unknown;
					try {
						parsed = typeof signBlockJson === 'string' ? JSON.parse(signBlockJson) : signBlockJson;
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON in Block to Sign field', {
							itemIndex: i,
						});
					}
					const blockErrors = validateBlockContents(parsed);
					if (blockErrors.length > 0) {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid block JSON: ${blockErrors.join('; ')}`,
							{ itemIndex: i },
						);
					}
					signOptions.block = parsed;
				} else {
					const hashToSign = this.getNodeParameter('hashToSign', i) as string;
					signOptions.hash = hashToSign;
				}

				const signOptionErrors = validateSignOptions(signOptions);
				if (signOptionErrors.length > 0) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid sign options: ${signOptionErrors.join('; ')}`,
						{ itemIndex: i },
					);
				}

				const signResult = await rpc.signBlock(signOptions);

				responseData = {
					signature: signResult.signature,
					...(signResult.block && { block: signResult.block }),
				};
				break;
			}

			case 'expandKey': {
				const privateKey = this.getNodeParameter('privateKey', i) as string;

				const expanded = await rpc.expandKey(privateKey);

				responseData = {
					privateKey,
					...expanded,
				};
				break;
			}

			case 'getDeterministicKey': {
				const seed = this.getNodeParameter('seed', i) as string;
				const index = this.getNodeParameter('index', i) as number;

				const keyPair = await rpc.getDeterministicKey(seed, index);

				responseData = {
					seed,
					index,
					...keyPair,
				};
				break;
			}

			case 'getAccountsBalances': {
				const accountsStr = this.getNodeParameter('accounts', i) as string;
				const accounts = accountsStr.split(',').map((a) => a.trim());
				const includeOnlyConfirmed = this.getNodeParameter(
					'accountsBalancesIncludeOnlyConfirmed',
					i,
					true,
				) as boolean;

				for (const account of accounts) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const { balances } = await rpc.getAccountsBalances(accounts, {
					includeOnlyConfirmed,
				});

				responseData = {
					balances,
				};
				break;
			}

			case 'getAccountFromPublicKey': {
				const publicKey = this.getNodeParameter('publicKey', i) as string;

				const { account } = await rpc.getAccountFromPublicKey(publicKey);

				responseData = {
					publicKey,
					account,
				};
				break;
			}

			case 'getAvailableSupply': {
				const { available: supply } = await rpc.getAvailableSupply();

				responseData = {
					availableSupply: rawToNano(supply),
					availableSupplyRaw: supply,
				};
				break;
			}

			case 'getPeers': {
				const peerDetails = this.getNodeParameter('peerDetails', i, false) as boolean;

				const { peers } = await rpc.getPeers(peerDetails ? { peer_details: true } : undefined);

				responseData = {
					peers,
				};
				break;
			}

			case 'getRepresentatives': {
				const sorting = this.getNodeParameter('sorting', i, false) as boolean;
				const countParam = this.getNodeParameter('count', i, 0) as number;
				const count = countParam > 0 ? countParam : undefined;

				const { representatives } = await rpc.getRepresentatives(count, sorting);

				responseData = {
					representatives,
				};
				break;
			}

			case 'getUptime': {
				const { seconds } = await rpc.getUptime();

				responseData = {
					seconds: parseInt(seconds),
				};
				break;
			}

			case 'getTelemetry': {
				const raw = this.getNodeParameter('telemetryRaw', i, false) as boolean;
				const address = this.getNodeParameter('telemetryAddress', i, '') as string;
				const port = this.getNodeParameter('telemetryPort', i, 7075) as number;

				const telemetry = await rpc.getTelemetry({
					raw,
					address: address || undefined,
					port: address ? port : undefined,
				});

				responseData = {
					...telemetry,
				};
				break;
			}

			case 'getStats': {
				const statsType = this.getNodeParameter('statsType', i) as string;

				const stats = await rpc.getStats(statsType);

				responseData = {
					...stats,
				};
				break;
			}

			case 'getUnchecked': {
				const count = this.getNodeParameter('count', i, 10) as number;

				const { blocks } = await rpc.getUnchecked(count);

				responseData = {
					count,
					blocks,
				};
				break;
			}

			case 'bootstrap': {
				const bootstrapAddress = this.getNodeParameter('bootstrapAddress', i) as string;
				const bootstrapPort = this.getNodeParameter('bootstrapPort', i) as number;
				const bypassFrontierConfirmation = this.getNodeParameter(
					'bootstrapBypassFrontierConfirmation',
					i,
					false,
				) as boolean;
				const bootstrapId = this.getNodeParameter('bootstrapId', i, '') as string;

				const { success } = await rpc.bootstrap(bootstrapAddress, bootstrapPort, {
					bypassFrontierConfirmation: bypassFrontierConfirmation || undefined,
					id: bootstrapId || undefined,
				});

				responseData = {
					success: success === '',
					address: bootstrapAddress,
					port: bootstrapPort,
				};
				break;
			}

			case 'stopNode': {
				const confirmed = this.getNodeParameter('stopNodeConfirmed', i, false) as boolean;
				if (!confirmed) {
					throw new NodeOperationError(
						this.getNode(),
						'stopNode requires confirmation. Set "Confirm Stop Node" to true to proceed.',
						{ itemIndex: i },
					);
				}

				const { success } = await rpc.stopNode();

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'getAccountsFrontiers': {
				const accountsListStr = this.getNodeParameter('accountsList', i) as string;
				const accountsList = accountsListStr.split(',').map((a) => a.trim());

				for (const account of accountsList) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const { frontiers } = await rpc.getAccountsFrontiers(accountsList);

				responseData = {
					accounts: accountsList,
					frontiers,
				};
				break;
			}

			case 'getAccountsReceivable': {
				const accountsListStr = this.getNodeParameter('accountsList', i) as string;
				const accountsList = accountsListStr.split(',').map((a) => a.trim());
				const count = this.getNodeParameter('accountsReceivableCount', i, 10) as number;
				const threshold = this.getNodeParameter('accountsReceivableThreshold', i, '') as string;
				const source = this.getNodeParameter('accountsReceivableSource', i, false) as boolean;
				const sorting = this.getNodeParameter('accountsReceivableSorting', i, false) as boolean;
				const offset = this.getNodeParameter('accountsReceivableOffset', i, 0) as number;

				for (const account of accountsList) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const receivable = await rpc.getAccountsReceivable(accountsList, {
					count,
					threshold: threshold || undefined,
					source,
					sorting,
					offset,
				});

				responseData = {
					accounts: accountsList,
					receivable,
				};
				break;
			}

			case 'getAccountsRepresentatives': {
				const accountsListStr = this.getNodeParameter('accountsList', i) as string;
				const accountsList = accountsListStr.split(',').map((a) => a.trim());

				for (const account of accountsList) {
					if (!isValidNanoAddress(account)) {
						throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
							itemIndex: i,
						});
					}
				}

				const { representatives } = await rpc.getAccountsRepresentatives(accountsList);

				responseData = {
					accounts: accountsList,
					representatives,
				};
				break;
			}

			case 'createBlock': {
				const blockType = this.getNodeParameter('blockType', i) as
					| 'state'
					| 'send'
					| 'receive'
					| 'change';

				const balance = this.getNodeParameter('balance', i, '') as string;
				const representative = this.getNodeParameter('representative', i) as string;
				const previous = this.getNodeParameter('previous', i) as string;

				const createBlockWallet = this.getNodeParameter('createBlockWallet', i, '') as string;
				const account = this.getNodeParameter('createBlockAccount', i, '') as string;
				const destination = this.getNodeParameter('destination', i, '') as string;
				const source = this.getNodeParameter('source', i, '') as string;
				const key = this.getNodeParameter('privateKey', i, '') as string;
				const link = this.getNodeParameter('link', i, '') as string;

				const workCreateBlock = this.getNodeParameter('workCreateBlock', i, '') as string;
				const jsonBlock = this.getNodeParameter('jsonBlock', i, true) as boolean;
				const workVersion = this.getNodeParameter('workVersion', i, '') as string;
				const difficulty = this.getNodeParameter('difficulty', i, '') as string;

				const { block } = await rpc.createBlock({
					type: blockType,
					json_block: jsonBlock,
					balance,
					representative: representative,
					previous: previous,
					wallet: createBlockWallet || undefined,
					account: account || undefined,
					key: key || undefined,
					destination: destination || undefined,
					source: source || undefined,
					link: link || undefined,
					work: workCreateBlock || undefined,
					version: workVersion || undefined,
					difficulty: difficulty || undefined,
				});

				responseData = {
					blockType,
					block,
				};
				break;
			}

			case 'getBlockHash': {
				const blockParamsRaw = this.getNodeParameter('blockParams', i);
				const jsonBlock = this.getNodeParameter('jsonBlock', i, true) as boolean;

				let blockParams: unknown;
				try {
					blockParams =
						typeof blockParamsRaw === 'string' ? JSON.parse(blockParamsRaw) : blockParamsRaw;
				} catch {
					throw new NodeOperationError(this.getNode(), 'Invalid block parameters JSON', {
						itemIndex: i,
					});
				}

				const blockErrors = validateBlockContents(blockParams);
				if (blockErrors.length > 0) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid block parameters: ${blockErrors.join('; ')}`,
						{ itemIndex: i },
					);
				}

				const { hash } = await rpc.getBlockHash(blockParams as rpcTypes.BlockContents, jsonBlock);

				responseData = {
					hash,
					block: blockParams as rpcTypes.BlockContents,
				};
				break;
			}

			case 'epochUpgrade': {
				const epoch = this.getNodeParameter('epoch', i) as number;
				const epochKey = this.getNodeParameter('epochKey', i) as string;
				const count = this.getNodeParameter('count', i, 1) as number;

				const { started } = await rpc.epochUpgrade(epoch, epochKey, count);

				responseData = {
					success: started === '1',
					epoch,
					count,
					started: started === '1',
				};
				break;
			}

			case 'keepalive': {
				const peerAddress = this.getNodeParameter('peerAddress', i) as string;
				const peerPort = this.getNodeParameter('peerPort', i) as number;

				await rpc.keepalive(peerAddress, peerPort);

				responseData = {
					success: true,
					address: peerAddress,
					port: peerPort,
				};
				break;
			}

			case 'getNodeId': {
				const nodeId = await rpc.getNodeId();

				responseData = {
					...nodeId,
				};
				break;
			}

			case 'populateBacklog': {
				await rpc.populateBacklog();

				responseData = {
					success: true,
				};
				break;
			}

			case 'republish': {
				const republishHash = this.getNodeParameter('republishHash', i) as string;
				const count = this.getNodeParameter('count', i, 1) as number;
				const sources = this.getNodeParameter('sources', i, 2) as number;
				const destinations = this.getNodeParameter('destinations', i, 2) as number;

				if (!isValidBlockHash(republishHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${republishHash}`, {
						itemIndex: i,
					});
				}

				const { blocks } = await rpc.republish(republishHash, count, sources, destinations);

				responseData = {
					success: true,
					hash: republishHash,
					count,
					sources,
					destinations,
					blocks,
				};
				break;
			}

			case 'getFrontierCount': {
				const { count } = await rpc.getFrontierCount();

				responseData = {
					count,
				};
				break;
			}

			case 'getSuccessors': {
				const startingBlock = this.getNodeParameter('startingBlock', i) as string;
				const count = this.getNodeParameter('count', i, 10) as number;
				const offset = this.getNodeParameter('chainOffset', i, 0) as number;
				const reverse = this.getNodeParameter('chainReverse', i, false) as boolean;

				if (!isValidBlockHash(startingBlock)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${startingBlock}`, {
						itemIndex: i,
					});
				}

				const options: { offset?: number; reverse?: boolean } = {};
				if (offset > 0) options.offset = offset;
				if (reverse) options.reverse = true;

				const { blocks: successors } = await rpc.getSuccessors(
					startingBlock,
					count,
					Object.keys(options).length > 0 ? options : undefined,
				);

				responseData = {
					startingBlock,
					successors,
				};
				break;
			}

			case 'getUnopened': {
				const unopenedAccount = this.getNodeParameter('unopenedAccount', i, '') as string;
				const count = this.getNodeParameter('count', i, 10) as number;

				if (unopenedAccount && !isValidNanoAddress(unopenedAccount)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid account address: ${unopenedAccount}`,
						{ itemIndex: i },
					);
				}

				const { accounts: unopened } = await rpc.getUnopened(unopenedAccount || undefined, count);

				responseData = {
					accounts: unopened,
				};
				break;
			}

			case 'getConfirmationActive': {
				const announcements = this.getNodeParameter('announcements', i, 0) as number;

				const confirmations = await rpc.getConfirmationActive(
					announcements > 0 ? { announcements } : undefined,
				);

				responseData = {
					confirmations,
				};
				break;
			}

			case 'getConfirmationHistory': {
				const confirmationHash = this.getNodeParameter('confirmationHash', i, '') as string;

				if (confirmationHash && !isValidBlockHash(confirmationHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${confirmationHash}`, {
						itemIndex: i,
					});
				}

				const history = await rpc.getConfirmationHistory(confirmationHash || undefined);

				responseData = {
					history,
				};
				break;
			}

			case 'getConfirmationQuorum': {
				const peerDetails = this.getNodeParameter('peerDetails', i, false) as boolean;

				const quorum = await rpc.getConfirmationQuorum(
					peerDetails ? { peer_details: true } : undefined,
				);

				responseData = {
					quorum,
				};
				break;
			}

			case 'getElectionStatistics': {
				const statistics = await rpc.getElectionStatistics();

				responseData = {
					statistics,
				};
				break;
			}

			case 'cancelWork': {
				const workHash = this.getNodeParameter('workHash', i) as string;

				if (!isValidBlockHash(workHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${workHash}`, {
						itemIndex: i,
					});
				}

				await rpc.cancelWork(workHash);

				responseData = {
					success: true,
					hash: workHash,
				};
				break;
			}

			case 'addWorkPeer': {
				const peerAddress = this.getNodeParameter('peerAddress', i) as string;
				const peerPort = this.getNodeParameter('peerPort', i) as number;

				await rpc.addWorkPeer(peerAddress, peerPort);

				responseData = {
					success: true,
					address: peerAddress,
					port: peerPort,
				};
				break;
			}

			case 'getWorkPeers': {
				const { work_peers: peers } = await rpc.getWorkPeers();

				responseData = {
					workPeers: peers,
				};
				break;
			}

			case 'clearWorkPeers': {
				await rpc.clearWorkPeers();

				responseData = {
					success: true,
				};
				break;
			}

			case 'bootstrapAny': {
				const force = this.getNodeParameter('bootstrapAnyForce', i, false) as boolean;
				const bootstrapId = this.getNodeParameter('bootstrapId', i, '') as string;
				const account = this.getNodeParameter('bootstrapAnyAccount', i, '') as string;

				if (account && !isValidNanoAddress(account)) {
					throw new NodeOperationError(this.getNode(), `Invalid account address: ${account}`, {
						itemIndex: i,
					});
				}

				const { success } = await rpc.bootstrapAny({
					force: force || undefined,
					id: bootstrapId || undefined,
					account: account || undefined,
				});

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'bootstrapLazy': {
				const lazyHash = this.getNodeParameter('lazyHash', i) as string;
				const force = this.getNodeParameter('force', i, false) as boolean;
				const bootstrapId = this.getNodeParameter('bootstrapId', i, '') as string;

				if (!isValidBlockHash(lazyHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${lazyHash}`, {
						itemIndex: i,
					});
				}

				const lazyResult = await rpc.bootstrapLazy(lazyHash, {
					force: force || undefined,
					id: bootstrapId || undefined,
				});

				responseData = {
					success: lazyResult.started === '1',
					hash: lazyHash,
					force,
					keyInserted: lazyResult.key_inserted === '1',
				};
				break;
			}

			case 'getBootstrapPriorities': {
				const { priorities } = await rpc.getBootstrapPriorities();

				responseData = {
					priorities,
				};
				break;
			}

			case 'resetBootstrap': {
				const { success } = await rpc.resetBootstrap();

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'getBootstrapStatus': {
				const status = await rpc.getBootstrapStatus();

				responseData = {
					...status,
				};
				break;
			}

			case 'getDatabaseTxnTracker': {
				const minReadTime = this.getNodeParameter('dbTxnMinReadTime', i, 1000) as number;
				const minWriteTime = this.getNodeParameter('dbTxnMinWriteTime', i, 0) as number;

				const tracker = await rpc.getDatabaseTxnTracker({
					minReadTime,
					minWriteTime,
				});

				responseData = {
					...tracker,
				};
				break;
			}

			case 'clearStats': {
				const { success } = await rpc.clearStats();

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'clearUnchecked': {
				const { success } = await rpc.clearUnchecked();

				responseData = {
					success: success === '',
				};
				break;
			}

			case 'getUncheckedBlock': {
				const uncheckedHash = this.getNodeParameter('uncheckedHash', i) as string;

				if (!isValidBlockHash(uncheckedHash)) {
					throw new NodeOperationError(this.getNode(), `Invalid block hash: ${uncheckedHash}`, {
						itemIndex: i,
					});
				}

				const { contents: block } = await rpc.getUncheckedBlock(uncheckedHash);

				responseData = {
					hash: uncheckedHash,
					block,
				};
				break;
			}

			case 'getUncheckedKeys': {
				const uncheckedKey = this.getNodeParameter('uncheckedKey', i, '') as string;
				const count = this.getNodeParameter('count', i, 10) as number;

				const keys = await rpc.getUncheckedKeys(uncheckedKey || undefined, count);

				responseData = {
					keys: keys.unchecked,
				};
				break;
			}

			case 'nanoToRawRPC': {
				const convertAmount = this.getNodeParameter('convertAmount', i) as string;

				const { amount: raw } = await rpc.nanoToRaw(convertAmount);

				responseData = {
					nano: convertAmount,
					raw,
				};
				break;
			}

			case 'rawToNanoRPC': {
				const convertAmount = this.getNodeParameter('convertAmount', i) as string;

				const { amount: nano } = await rpc.rawToNano(convertAmount);

				responseData = {
					raw: convertAmount,
					nano,
				};
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
					itemIndex: i,
				});
		}

		return responseData;
	}.call(executeFunctions);
}
