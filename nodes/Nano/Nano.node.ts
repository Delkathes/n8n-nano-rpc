import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IDataObject,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import { createNanoRPC } from '../../libs/nano-rpc/nano-rpc';
import type * as rpcTypes from '../../types';

import { accountNanoRPCParameterProperties } from './descriptions/parameter-properties-account';
import { blockNanoRPCParameterProperties } from './descriptions/parameter-properties-block';
import { commonNanoRPCParameterProperties } from './descriptions/parameter-properties-common';
import { confirmationNanoRPCParameterProperties } from './descriptions/parameter-properties-confirmation';
import { conversionNanoRPCParameterProperties } from './descriptions/parameter-properties-conversion';
import { debugNanoRPCParameterProperties } from './descriptions/parameter-properties-debug';
import { keyNanoRPCParameterProperties } from './descriptions/parameter-properties-keys';
import { ledgerNanoRPCParameterProperties } from './descriptions/parameter-properties-ledger';
import { networkNanoRPCParameterProperties } from './descriptions/parameter-properties-network';
import { coreNanoRPCProperties } from './descriptions/operation-properties';
import { representativeNanoRPCParameterProperties } from './descriptions/parameter-properties-representative';
import { transactionNanoRPCParameterProperties } from './descriptions/parameter-properties-transaction';
import { walletNanoRPCParameterProperties } from './descriptions/parameter-properties-wallet';
import { workNanoRPCParameterProperties } from './descriptions/parameter-properties-work';
import { dispatchNanoOperation } from './handlers/operation-dispatcher';

export class Nano implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nano Node RPC',
		name: 'nano',
		icon: {
			light: 'file:nano.svg',
			dark: 'file:nano.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Nano cryptocurrency network',
		defaults: {
			name: 'Nano Node RPC',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'nanoApi',
				required: true,
			},
		],
		codex: {
			categories: ['Development', 'Cryptocurrency'],
			subcategories: {
				Development: ['Blockchain'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.nano.org/commands/rpc-protocol/',
					},
				],
			},
		},
		properties: [
			...coreNanoRPCProperties,
			{
				displayName:
					'This operation requires <code>enable_control = true</code> in your Nano node configuration. Without it, the RPC call will be rejected.',
				name: 'enableControlNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'send',
							'receive',
							'processBlock',
							'epochUpgrade',
							'createBlock',
							'createAccount',
							'accountsCreate',
							'accountMove',
							'accountRemove',
							'accountRepresentativeSet',
							'passwordChange',
							'receiveMinimum',
							'receiveMinimumSet',
							'searchReceivable',
							'searchReceivableAll',
							'walletAdd',
							'walletAddWatch',
							'walletChangeSeed',
							'walletCreate',
							'walletDestroy',
							'walletLedger',
							'walletLock',
							'walletReceivable',
							'walletRepresentativeSet',
							'walletRepublish',
							'walletWorkGet',
							'workGet',
							'workSet',
							'keepalive',
							'populateBacklog',
							'getLedger',
							'getUnopened',
							'generateWork',
							'cancelWork',
							'addWorkPeer',
							'getWorkPeers',
							'clearWorkPeers',
							'getNodeId',
							'stopNode',
							'bootstrap',
							'bootstrapAny',
							'bootstrapLazy',
							'resetBootstrap',
							'getBootstrapPriorities',
							'clearStats',
							'clearUnchecked',
							'getDatabaseTxnTracker',
						],
					},
				},
			},
			...accountNanoRPCParameterProperties,
			...representativeNanoRPCParameterProperties,
			...transactionNanoRPCParameterProperties,
			...blockNanoRPCParameterProperties,
			...ledgerNanoRPCParameterProperties,
			...networkNanoRPCParameterProperties,
			...confirmationNanoRPCParameterProperties,
			...debugNanoRPCParameterProperties,
			...conversionNanoRPCParameterProperties,
			...walletNanoRPCParameterProperties,
			...workNanoRPCParameterProperties,
			...keyNanoRPCParameterProperties,
			...commonNanoRPCParameterProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('nanoApi');
		const rpcUrl = credentials.rpcUrl as string;
		const credentialsWalletId = credentials.walletId as string;
		const defaultSourceAccount = credentials.sourceAccount;
		const rpcClientCache = new Map<string, ReturnType<typeof createNanoRPC>>();

		for (let i = 0; i < items.length; i++) {
			try {
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const timeoutMs =
					typeof options.timeout === 'number' && Number.isFinite(options.timeout)
						? Math.max(1000, Math.floor(options.timeout))
						: undefined;
				const maxRetries =
					typeof options.maxRetries === 'number' && Number.isFinite(options.maxRetries)
						? Math.max(0, Math.floor(options.maxRetries))
						: undefined;

				const cacheKey = `${timeoutMs ?? 'default'}:${maxRetries ?? 'default'}`;
				let rpc = rpcClientCache.get(cacheKey);

				if (!rpc) {
					rpc = createNanoRPC(this, {
						rpcUrl,
						timeoutMs,
						maxRetries,
					});
					rpcClientCache.set(cacheKey, rpc);
				}

				const responseData: rpcTypes.NanoOperationResponse = await dispatchNanoOperation({
					executeFunctions: this,
					rpc,
					operation,
					itemIndex: i,
					credentialsWalletId,
					defaultSourceAccount,
				});

				returnData.push({
					json: responseData as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
							operation,
							itemIndex: i,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error);
			}
		}

		return [returnData];
	}
}
