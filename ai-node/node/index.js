const polkadotApi = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const polkadotContractApi = require("@polkadot/api-contract");
const { BN, BN_ONE } = require("@polkadot/util");
const { program } = require("commander");
const CONTRACT_METADATA = require("./nikolaus_dao.json");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { Storage } = require('@google-cloud/storage');

console.log("NikolausDAO AI Node - Node.JS is running!");

const inferenceApiUrl = "http://127.0.0.1:5000";

/** Used to generate a new 3D model */
async function generateModel(prompt) {
    console.log("Calling AI inference server (model) with prompt: " + prompt + " ...");
    const encodedPrompt = encodeURIComponent(prompt);
    const response = await fetch(`${inferenceApiUrl}/generate?prompt=${encodedPrompt}`, {
        method: "GET",
    });
    const data = await response.json();
    const files = data.files;
    const firstFile = files[0];
    // Download the first file
    const downloadResponse = await fetch(firstFile);
    const blob = await downloadResponse.blob();
    // Return .obj file content
    return await blob.text();
}

/** Used to generate a new message */
async function generateMessage(prompt) {
    console.log("Calling AI inference server (message) with prompt: " + prompt + " ...");
    const encodedPrompt = encodeURIComponent(prompt);
    const response = await fetch(`${inferenceApiUrl}/message?prompt=${encodedPrompt}`, {
        method: "GET",
    });
    const data = await response.json();
    return data.message;
}

const storageDepositLimit = null;

async function readMembers({
    gasLimit,
    contract,
    user
}) {

    const { output } = await contract.query.getMembers(
        user.address,
        {
            gasLimit,
            storageDepositLimit,
        },
    );

    const membersArray = output.toPrimitive().ok;

    return membersArray;

}

async function readGifts({
    gasLimit,
    contract,
    user
}) {

    const { output } = await contract.query.getNodeGifts(
        user.address,
        {
            gasLimit,
            storageDepositLimit,
        },
    );

    const giftsArray = output.toPrimitive().ok;

    return giftsArray;
}

async function main() {

    program.requiredOption("-s, --suri <suri>")
        .requiredOption("-c, --contract <contractAddress>")
        .requiredOption("-u, --url <nodeUrl>", "Node URL to connect to", "ws://127.0.0.1:9944")
        .requiredOption("-d, --directory <directory>", "Model directory", "models")
        .parse();

    const opts = program.opts();

    console.log("Directory: " + opts.directory);
    console.log("SURI: " + opts.suri);
    console.log("Contract address: " + opts.contract);
    console.log("Node URL: " + opts.url);

    console.log("Initializing Cloud Storage client ...");
    const storage = new Storage();

    if (!fs.existsSync(opts.directory)) {
        fs.mkdirSync(opts.directory);
    }

    console.log("Connecting to node...");

    const wsProvider = new polkadotApi.WsProvider(opts.url);
    const api = new polkadotApi.ApiPromise({ provider: wsProvider });

    await api.isReady;

    console.log("Connected to node!");

    console.log("Creating keyring ...");

    const keyring = new Keyring({ type: 'sr25519' });
    const user = keyring.addFromUri(opts.suri);

    console.log("Keyring created!");

    const contract = new polkadotContractApi.ContractPromise(api, CONTRACT_METADATA, opts.contract);

    console.log("Contract created!");

    const gasLimit = api.registry.createType("WeightV2", {
        refTime: new BN("10000000000"),
        proofSize: new BN("10000000000"),
    });

    while (true) {

        const members = await readMembers({
            gasLimit,
            contract,
            user
        });
        const existingGifts = await readGifts({
            gasLimit,
            contract,
            user
        });
        const thisNodeGifts = existingGifts.filter(
            gift => gift.byNodeAccountId === user.address
        );
        const ungiftedMembers = members.filter(
            member => thisNodeGifts.find(
                gift => gift.forMemberAccountId === member.accountId
            ) === undefined
        );

        if (ungiftedMembers.length === 0) {
            console.log("No members to gift, waiting 1 seconds...");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            for (const member of ungiftedMembers) {
                const model = await generateModel(member.prompt);
                const message = await generateMessage(member.prompt);

                const tempFileName = new Date().getTime();
                fs.writeFileSync(
                    opts.directory + "/" + tempFileName + ".obj",
                    model
                );
                console.log("Generated message: " + message);
                console.log("Saved .obj file to " + tempFileName);

                storage.bucket("pdc-public-data.bokov.me").upload(
                    opts.directory + "/" + tempFileName + ".obj",
                    {
                        destination: "models/" + tempFileName + ".obj"
                    }
                );

                const storageUrl = `https://storage.googleapis.com/pdc-public-data.bokov.me/models/${tempFileName}.obj`;
                console.log(storageUrl);
            }
        }

        break;

    }

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