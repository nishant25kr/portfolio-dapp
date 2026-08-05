import { useEffect, useState } from 'react';
import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import '@solana/wallet-adapter-react-ui/styles.css';

function App() {

  const endpoint = "https://mainnet.helius-rpc.com/?api-key=d585ad2a-c708-441d-bd5d-b704df496d5f"
  const { publicKey } = useWallet();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>

          <div className='flex justify-end'>
            {!publicKey && <WalletMultiButton />}
            {publicKey && <WalletDisconnectButton />}
          </div>

          <div>
            <Portfolio />
          </div>

          <div>
            <Transfer />
          </div>

          <div>
            <RequestAirdrop />
          </div>

        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App


function Portfolio() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<null | number>(null)

  useEffect(() => {
    (async () => {
      if (publicKey) {
        const balance = await connection.getBalance(publicKey)
        setBalance(balance)
      }
    })()
  }, [publicKey])

  return (
    <div>
      <h1>{JSON.stringify(publicKey)}</h1>
      <h1>Balance:{JSON.stringify(balance)}</h1>
    </div>
  )
}

function Transfer() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [address, setAddress] = useState<null | string>(null)
  const [amount, setAmount] = useState<null | number>(null)

  return (
    <div>
      transfer
      <input
        type='text'
        placeholder='Enter public key'
        onChange={(e) => setAddress(e.target.value)}
      />

      <input
        type='number'
        placeholder='Amount'
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <button
        onClick={async () => {
          if (!publicKey || !address || amount == null) {
            throw new Error("Missing required values");
          }
          const transection = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey!,
              toPubkey: new PublicKey(address!.toString()),
              lamports: amount! * LAMPORTS_PER_SOL

            })
          )

          await sendTransaction(transection, connection)
        }}
      >Send SOL</button>
    </div>
  )
}

function RequestAirdrop() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState<null | number>(null)

  return (
    <div>
      <input type='number' placeholder='Amount' onChange={(e) => setAmount(Number(e.target.value))} />
      <button      
        onClick={async () => {
          try {
            if (!amount || !wallet) return;
          await connection.requestAirdrop(wallet.publicKey!, amount * LAMPORTS_PER_SOL)  
          } catch (error: any) {
            console.log(error.message)
          }
        }}
      >Request Money</button>

    </div>
  )
}

