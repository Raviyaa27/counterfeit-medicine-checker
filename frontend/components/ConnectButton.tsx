"use client";

import { useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { chain } from "@/lib/config";

export function ConnectButton() {
  const { address, isConnected, chainId } = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!isConnected) {
    return (
      <button className="btn" onClick={() => connect.mutate({ connector: injected() })}>
        Connect MetaMask
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chainId !== chain.id && (
        <button className="btn" onClick={() => switchChain.mutate({ chainId: chain.id })}>
          Switch to {chain.id === 31337 ? "Anvil (local)" : chain.name}
        </button>
      )}
      <button className="btn-secondary" onClick={() => disconnect.mutate()}>
        {address?.slice(0, 6)}...{address?.slice(-4)} (disconnect)
      </button>
    </div>
  );
}
