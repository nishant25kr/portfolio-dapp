import { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import '@solana/wallet-adapter-react-ui/styles.css';

export function App() {
  const endpoint = "https://mainnet.helius-rpc.com/?api-key=d585ad2a-c708-441d-bd5d-b704df496d5f";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Main />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function Main() {
  const { publicKey } = useWallet();

  return (
    <>
      
      <div className="flex justify-end">
        {publicKey ? <WalletDisconnectButton /> : (
          <WalletMultiButton />
        )}
      </div>

      <Portfolio />
      <Transfer />
      <RequestAirdrop />
      <Mint/>

    </>
  )
}

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

function Mint(){
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState('');
  const [mintError, setMintError] = useState('');

  const mint = useMemo(() => {
    if (!mintAddress) return null;
    try {
      return new PublicKey(mintAddress);
    } catch (error) {
      return null;
    }
  }, [mintAddress]);

  useEffect(() => {
    if (mintAddress && !mint) {
      setMintError('Invalid mint address');
    } else {
      setMintError('');
    }
  }, [mintAddress, mint]);

  useEffect(() => {
    async function loadTokens() {
      if (!publicKey) return;

      const accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );
console.log(accounts)
      for (const { account } of accounts.value) {
        const info = account.data.parsed.info;

        console.log({
          mint: info.mint,
          balance: info.tokenAmount.uiAmount,
        });

        // Fetch metadata for info.mint here  
      }
    }

    loadTokens();
  }, [publicKey, connection]);

  return (
    <div>
      <input
        type="text"
        placeholder="Enter token mint address"
        value={mintAddress}
        onChange={(e) => setMintAddress(e.target.value)}
      />
      {mintError && <div style={{ color: 'red' }}>{mintError}</div>}
      {mint && <div>Mint key is valid: {mint.toBase58()}</div>}
    </div>
  );
}