import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { supportedWallets } from '../services/walletService.js';
import Icon from './ui/Icon.jsx';

export function shortenAddress(address) {
  return address.length > 10
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : address;
}

export function WalletStatus() {
  const walletName = useStore((s) => s.walletName),
    address = useStore((s) => s.walletAddress),
    disconnect = useStore((s) => s.disconnectWallet);
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const copyAddress = async () => {
    if (!navigator.clipboard?.writeText) {
      useStore
        .getState()
        .notify('Copying the address is unavailable in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      useStore
        .getState()
        .notify('Copying the address is unavailable in this browser.');
    }
  };

  return (
    <div className="wallet-status">
      <div className="wallet-status-heading">
        <strong>{walletName?.toUpperCase()}</strong>
        <span>Connected</span>
      </div>
      <code className="wallet-address" data-testid="wallet-address" title={address}>
        {shortenAddress(address)}
      </code>
      <div className="wallet-status-actions">
        <button className="outline-button" onClick={copyAddress}>
          {copied ? 'Copied' : 'Copy Address'}
        </button>
        <button className="text-button" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default function WalletConnect() {
  const open = useStore((s) => s.walletPickerOpen),
    address = useStore((s) => s.walletAddress),
    connecting = useStore((s) => s.walletConnecting),
    error = useStore((s) => s.walletError);
  const ref = useRef();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const keydown = (event) => {
      if (event.key === 'Escape') {
        useStore.getState().closeWalletPicker();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), a[href], [tabindex="0"]',
        ),
      ];
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    ref.current?.querySelector('button:not(:disabled)')?.focus();
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="wallet-selector-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget)
          useStore.getState().closeWalletPicker();
      }}
    >
      <section
        ref={ref}
        className="wallet-selector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-selector-title"
      >
        <div className="wallet-selector-heading">
          <span className="eyebrow">SOLANA WALLET LINK</span>
          <button
            className="icon-button"
            aria-label="Close wallet selector"
            onClick={() => useStore.getState().closeWalletPicker()}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="wallet-selector-title">
          {address ? 'Wallet connected' : 'Connect wallet'}
        </h2>
        {address ? (
          <WalletStatus />
        ) : (
          <>
            <p className="wallet-selector-description">
              Choose a wallet to share its Solana public address.
            </p>
            <div className="wallet-options">
              {supportedWallets.map((name) => (
                <button
                  key={name}
                  className="wallet-option"
                  aria-label={name}
                  disabled={connecting}
                  onClick={() => useStore.getState().connectWallet(name)}
                >
                  <span>{name}</span>
                  <small>{connecting ? 'CONNECTING…' : 'Connect'}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {error && (
          <p className="wallet-error" role="alert">
            {error}
            {error === 'Phantom wallet extension not detected.' && (
              <a
                href="https://phantom.com/download"
                target="_blank"
                rel="noreferrer"
              >
                Install Phantom
              </a>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
