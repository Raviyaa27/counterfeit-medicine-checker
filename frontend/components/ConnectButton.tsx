"use client";

import { useConnect, useConnection, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectButton() {
  const { address, isConnected } = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (isConnected) {
    return (
      <button onClick={() => disconnect.mutate()}>
        {address?.slice(0, 6)}...{address?.slice(-4)} (disconnect)
      </button>
    );
  }
  return <button onClick={() => connect.mutate({ connector: injected() })}>Connect MetaMask</button>;
}
