const polkadotApi = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const polkadotContractApi = require("@polkadot/api-contract");
const { BN, BN_ONE } = require("@polkadot/util");
const { program } = require("commander");
const CONTRACT_METADATA = require("../../SmartContract/flipper/target/ink/flipper.json");

console.log("NikolausDAO AI Node - Node.JS is running!");

const inferenceApiUrl = "http://127.0.0.1:5000/generate";

/** Used to generate a new 3D model */
async function generateModel(prompt) {
    console.log("Calling AI inference server with prompt: " + prompt + " ...");
    const encodedPrompt = encodeURIComponent(prompt);
    const response = await fetch(`${inferenceApiUrl}?prompt=${encodedPrompt}`, {
        method: "GET",
    });
    const data = await response.json();
    const files = data.files;
    const firstFile = files[0];
    // Download the first file
    const downloadResponse = await fetch(firstFile);
    const blob = await downloadResponse.blob();
    // Return .obj file content
    return blob;
}

async function main() {

    program.requiredOption("-s, --suri <suri>")
        .requiredOption("-c, --contract <contractAddress>")
        .requiredOption("-u, --url <nodeUrl>", "Node URL to connect to", "ws://127.0.0.1:9944")
        .parse();

    const opts = program.opts();

    console.log("SURI: " + opts.suri);
    console.log("Contract address: " + opts.contract);
    console.log("Node URL: " + opts.url);

    console.log("Connecting to node...");

    const wsProvider = new polkadotApi.WsProvider(opts.url);
    const api = new polkadotApi.ApiPromise({ provider: wsProvider });

    await api.isReady;

    console.log("Connected to node!");

    console.log("Creating keyring ...");

    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri(opts.suri);
    const bob = keyring.addFromUri('//Bob');

    console.log("Keyring created!");

    const gasLimit = api.registry.createType('WeightV2', {
        regTime: new BN(5_000_000_000_000).isub(BN_ONE),
        proofSize: new BN(1_000_000)
    });
    const storageDepositLimit = null;

    const contract = new polkadotContractApi.ContractPromise(api, CONTRACT_METADATA, opts.contract);

    console.log("Contract created!");

    console.log("Calling contract ...");

    // (We perform the send from an account, here using Alice's address)
    const { gasRequired, result } = await contract.query.get(
        alice.address,
        {
            gasLimit: api.registry.createType("WeightV2", {
                refTime: new BN("10000000000"),
                proofSize: new BN("10000000000"),
            }),
            storageDepositLimit,
        },
    );

    console.log(gasRequired.toHuman());
    console.log(result.toHuman());

}

main()
    .then(
        () => process.exit(0),
    )
    .catch(
        (error) => {
            console.error(error);
            process.exit(1);
        },
    );