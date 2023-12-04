import { createRoot } from "react-dom/client";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
const { BN, BN_ONE } = require("@polkadot/util");
import { useEffect, useRef, useState } from "react";
import CONTRACT_METADATA from "./nikolaus_dao.json";
import keyring from '@polkadot/ui-keyring';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

const CONTRACT_ID = "5CJoTBJGWy2dhc6kEZvzHuo7ZURhPsHDMWnL9RDZ29uzG2AF";

function App() {
    const [address, setAddress] = useState("");
    const [prompt, setPrompt] = useState("");
    const [ready, setReady] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isLoadingBecomeMember, setIsLoadingBecomeMember] = useState(false);
    const wsProviderRef = useRef(null);
    const apiRef = useRef(null);
    const contractRef = useRef(null);
    const gasLimitRef = useRef(null);

    const becomeMember = async () => {
        setIsLoadingBecomeMember(true);
        try {
            const injector = await web3FromAddress(selectedAddress);
            const result = await new Promise(
                (resolve, reject) => {
                    contractRef.current.tx.addMember(
                        {
                            gasLimit: gasLimitRef.current,
                            storageDepositLimit: null,
                            value: "1000"
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
                }
            );
            console.log(result);
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoadingBecomeMember(false);
        }
    };

    useEffect(
        () => {
            (async () => {
                const wsProvider = new WsProvider('wss://rococo-contracts-rpc.polkadot.io');
                const api = await ApiPromise.create({ provider: wsProvider });
                await api.isReady;
                const contract = new ContractPromise(api, CONTRACT_METADATA, CONTRACT_ID);
                wsProviderRef.current = wsProvider;
                apiRef.current = api;
                contractRef.current = contract;

                const gasLimit = api.registry.createType("WeightV2", {
                    refTime: new BN("2000000000"),
                    proofSize: new BN("200000"),
                });
                gasLimitRef.current = gasLimit;

                const allInjected = await web3Enable('Nikolaus DAO');
                const allAccounts = await web3Accounts();
                setAccounts(allAccounts);
                console.log(allAccounts);

                setReady(true);
            })();
        },
        []
    );

    return <section className="hero is-info is-fullheight">
        <div className="hero-body">
            <div class="" style={{ width: '100%' }}>
                {ready && (
                    <>
                        <p className="title">NikolausDAO</p>
                        <p className="subtitle">Choose one of the options below!</p>
                        <div className="is-flex is-flex-direction-column is-justify-content-space-evenly">
                            <div className="control">
                                <select className="select is-large" value={selectedAddress}
                                    onChange={(e) => setSelectedAddress(e.target.value)}
                                >
                                    <option value={null}>Select an account</option>
                                    {accounts.map((account) => {
                                        return <option value={account.address}>{account.meta.name} ({account.address})</option>;
                                    })}
                                </select>
                            </div>
                            <div className="control">
                                <input className="input is-large" type="text" placeholder="Your address" value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="control">
                                <input className="input is-large" type="text" placeholder="Your prompt" value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>
                            <button onClick={becomeMember} disabled={isLoadingBecomeMember} className={"button is-primary is-large " + (isLoadingBecomeMember ? 'is-loading' : '')}>Become a member</button>
                        </div>
                    </>
                )}
                {!ready && (<>Loading...</>)}
            </div>
        </div>
    </section >;
}

const appContainer = document.getElementById("app");
createRoot(appContainer).render(<App />);
