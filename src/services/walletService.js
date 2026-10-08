import { getWallets } from '@wallet-standard/app';

const CONNECT = 'standard:connect';
const DISCONNECT = 'standard:disconnect';
const EVENTS = 'standard:events';

export const supportedWallets = ['Phantom', 'Solflare'];

const isSolanaChain = (chain) =>
  typeof chain === 'string' && chain.startsWith('solana:');

export class WalletNotFoundError extends Error {
  constructor(name) {
    super(`${name} wallet extension not detected.`);
    this.code = 'WALLET_NOT_FOUND';
  }
}

export class WalletAccountError extends Error {
  constructor(name) {
    super(`${name} did not return a Solana account.`);
    this.code = 'WALLET_ACCOUNT_UNAVAILABLE';
  }
}

export function getSolanaAccount(accounts) {
  return accounts?.find(
    (account) =>
      typeof account?.address === 'string' &&
      account.address.length > 0 &&
      account.chains?.some(isSolanaChain),
  );
}

export function findWallet(name) {
  if (typeof window === 'undefined') return null;
  return (
    getWallets()
      .get()
      .find(
        (wallet) =>
          wallet.name.toLowerCase() === name.toLowerCase() &&
          wallet.chains?.some(isSolanaChain),
      ) ?? null
  );
}

export async function connectWallet(name) {
  const wallet = findWallet(name);
  if (!wallet) throw new WalletNotFoundError(name);

  const connect = wallet.features?.[CONNECT]?.connect;
  if (typeof connect !== 'function')
    throw new Error(`${name} wallet does not support connection.`);

  const { accounts } = await connect();
  const account = getSolanaAccount(accounts);
  if (!account) throw new WalletAccountError(name);
  return { wallet, account };
}

export function onWalletChange(wallet, onChange) {
  const on = wallet.features?.[EVENTS]?.on;
  if (typeof on !== 'function') return () => {};
  try {
    const off = on('change', (event) => {
      if (event && 'accounts' in event) onChange(event.accounts);
    });
    return typeof off === 'function' ? off : () => {};
  } catch {
    return () => {};
  }
}

export async function disconnectWallet(wallet) {
  const disconnect = wallet?.features?.[DISCONNECT]?.disconnect;
  if (typeof disconnect === 'function') await disconnect();
}
