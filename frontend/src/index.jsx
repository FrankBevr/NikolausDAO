/** 
 * This is the frontend application, deployed to nikolausdao.surge.sh.
 * It uses React, Bulma, and the Polkadot.JS libraries.
 * */

import { createRoot } from "react-dom/client";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
const { BN } = require("@polkadot/util");
import { useEffect, useRef, useState } from "react";
import CONTRACT_METADATA from "./nikolaus_dao.json";
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

// The address of the deployed Smart Contract (POC is on Rococo Contracts)
const CONTRACT_ID = "5CJoTBJGWy2dhc6kEZvzHuo7ZURhPsHDMWnL9RDZ29uzG2AF";

// A single god component, that implements the whole application
function App() {
    // Declare state variables
    const [address, setAddress] = useState("");
    const [prompt, setPrompt] = useState("");
    const [ready, setReady] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isLoadingBecomeMember, setIsLoadingBecomeMember] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);
    const [error, setError] = useState(null);
    const [statusText, setStatusText] = useState(null);
    const [didParticipate, setDidParticipate] = useState(false);

    // Using refs for the Polkadot.JS library stuff
    const wsProviderRef = useRef(null);
    const apiRef = useRef(null);
    const contractRef = useRef(null);
    const gasLimitRef = useRef(null);

    // Displays an error message
    const onError = (e) => {
        console.log(e);
        setError(`${e}`);
        setIsLoadingBecomeMember(false);
    }

    // Called when the user clicks on the "Become a member" button
    const becomeMember = async () => {
        // Input validation
        if (selectedAddress === null) {
            onError("❌ You must select an account!");
            return;
        }

        if (!address || address.length === 0) {
            onError("📫 You must provide an address!");
            return;
        }

        if (!prompt || prompt.length === 0) {
            onError("📝 You must provide a prompt!");
            return;
        }

        if (paidAmount < 1000) {
            onError("💰 You must pay at least 1000 units to join to DAO!");
            return;
        }

        // Start loading
        setIsLoadingBecomeMember(true);
        try {
            // Smart contract interaction, which sends the prompt and home address of the user to become a member of the DAO
            const injector = await web3FromAddress(selectedAddress);
            await new Promise(
                (resolve, reject) => {
                    try {
                        contractRef.current.tx.addMember(
                            {
                                gasLimit: gasLimitRef.current,
                                storageDepositLimit: null,
                                value: `${paidAmount}`
                            },
                            address,
                            prompt
                        ).signAndSend(
                            selectedAddress,
                            { signer: injector.signer },
                            status => {
                                if (status.isInBlock) {
                                    resolve(status);
                                } else if (status.isFinalized) {
                                    resolve(status);
                                } else if (status.isError) {
                                    reject(status);
                                }
                            }
                        );
                    } catch (e) {
                        reject(e);
                    }
                }
            );
            setStatusText(`🎉 Thank you for participating in Nikolaus DAO!`);
            setDidParticipate(true);
        } catch (e) {
            onError(e);
        } finally {
            setIsLoadingBecomeMember(false);
        }
    };

    // We initialize the Polkadot.JS libraries in this useEffect hook
    // This makes sure it is only executed exactly once, when the app is loaded
    useEffect(
        () => {
            (async () => {
                // Initialize the API and the contract
                const wsProvider = new WsProvider('wss://rococo-contracts-rpc.polkadot.io');
                const api = await ApiPromise.create({ provider: wsProvider });
                await api.isReady;
                const contract = new ContractPromise(api, CONTRACT_METADATA, CONTRACT_ID);
                wsProviderRef.current = wsProvider;
                apiRef.current = api;
                contractRef.current = contract;

                // This is stolen from a random GitHub issue, and was adjusted for the Rococo network
                const gasLimit = api.registry.createType("WeightV2", {
                    refTime: new BN("2000000000"),
                    proofSize: new BN("200000"),
                });
                gasLimitRef.current = gasLimit;

                // Show authorization popup
                await web3Enable('Nikolaus DAO');

                // Get all accounts
                const allAccounts = await web3Accounts();
                setAccounts(allAccounts);

                setReady(true);
            })();
        },
        []
    );

    return <section className="hero is-link is-fullheight">
        <div className="hero-body">
            <div class="" style={{ width: '100%' }}>
                {ready && (
                    <>
                        <h1 className="title">🎅 Nikolaus DAO</h1>
                        <p className="subtitle">
                            <div className="notification is-info">
                                <div className="content">
                                    <ul>
                                        <li>Throw your prompt in a hat by <b>joining the DAO</b></li>
                                        <li>Run your AI to <b>generate gifts</b> and <b>get paid</b></li>
                                        <li>Come the <b>6th of December</b>, and you'll receive a <b>random 3D-printed gift</b></li>
                                    </ul>
                                </div>
                            </div>
                        </p>
                        <div className="is-flex is-flex-direction-column">
                            {!didParticipate && (
                                <>
                                    <div className="select is-large is-rounded mb-2">
                                        <select className="select is-large" value={selectedAddress}
                                            onChange={(e) => setSelectedAddress(e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value={null}>Select an account</option>
                                            {accounts.map((account) => {
                                                return <option value={account.address}>{account.meta.name} ({account.address})</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="control mb-2">
                                        <input className="input is-large is-rounded" type="text" placeholder="Your address" value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </div>
                                    <div className="control mb-2">
                                        <input className="input is-large is-rounded" type="text" placeholder="Your prompt" value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                        />
                                    </div>
                                    <div className="control mb-2">
                                        <input className="input is-large is-rounded" type="text" placeholder="Amount" value={paidAmount}
                                            onChange={(e) => setPaidAmount(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={becomeMember} disabled={isLoadingBecomeMember} className={"button is-primary is-large mb-2 is-rounded " + (isLoadingBecomeMember ? 'is-loading' : '')}>Become a member</button>
                                </>
                            )}
                            {
                                error && (
                                    <div className="notification is-danger mb-2">
                                        <button className="delete" onClick={() => setError(null)}></button>
                                        {error}
                                    </div>
                                )
                            }
                            {
                                statusText && (
                                    <div className="notification is-success mb-2 content">
                                        <button className="delete" onClick={() => setStatusText(null)}></button>
                                        {statusText}
                                    </div>
                                )
                            }
                        </div>
                    </>
                )}
                {!ready && (<progress class="progress is-large is-success" max="100">0%</progress>)}
            </div>
        </div>
    </section >;
}

// Render the app
const appContainer = document.getElementById("app");
createRoot(appContainer).render(<App />);
