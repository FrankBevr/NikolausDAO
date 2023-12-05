/** 
 * This script runs on the AI Node operator's machine.
 * It interacts with the Smart Contract to read the member prompts.
 * Then, it delegates to the Python AI script to generate 3D models, and messages via Large Language Models.
 * Then, it pushes the generated gifts to the Smart Contract.
 */

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

/** URL of the Python AI inference server */
const inferenceApiUrl = "http://127.0.0.1:5000";

/** Used to generate a new 3D model */
async function generateModel(prompt) {
    console.log("Calling AI inference server (model) with prompt: " + prompt + " ...");
    const encodedPrompt = encodeURIComponent(prompt);

    // Call the AI inference server
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

    // Call the AI inference server
    const response = await fetch(`${inferenceApiUrl}/message?prompt=${encodedPrompt}`, {
        method: "GET",
    });
    const data = await response.json();

    // Return message
    return data.message;
}

// This needs to be null for all Smart Contract interactions
const storageDepositLimit = null;

// Reads all members of the DAO from the Smart Contract
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

// Read already created gifts from the Smart Contract
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

// Generates a random ID for saving the .obj files
function randomId() {
    const length = 24;
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Main loop of the AI Node script
// It will continously read members and gifts from the contract, and process any jobs that haven't been completed by this node yet
async function main() {

    // Set up CLI options
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

    // Initialize Cloud Storage client for storing .obj files
    // This is POC code, in the real world, we would use IPFS
    console.log("Initializing Cloud Storage client ...");
    const storage = new Storage();

    // Create output directory
    if (!fs.existsSync(opts.directory)) {
        fs.mkdirSync(opts.directory);
    }

    // Connect to the specified node
    console.log("Connecting to node...");

    const wsProvider = new polkadotApi.WsProvider(opts.url);
    const api = new polkadotApi.ApiPromise({ provider: wsProvider });

    await api.isReady;

    console.log("Connected to node!");

    // Create keyring, add the specified account from a SURI
    console.log("Creating keyring ...");

    const keyring = new Keyring({ type: 'sr25519' });
    const user = keyring.addFromUri(opts.suri);

    console.log("Keyring created!");

    // Create API for the contract
    const contract = new polkadotContractApi.ContractPromise(api, CONTRACT_METADATA, opts.contract);

    console.log("Contract created!");

    const gasLimit = api.registry.createType("WeightV2", {
        refTime: new BN("2000000000"),
        proofSize: new BN("200000"),
    });

    const membersGiftedInThisProcess = [];

    // Main loop
    while (true) {

        // Read members and already created gifts
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

        // Find members, for whom this node hasn't created a gift yet
        const thisNodeGifts = existingGifts.filter(
            gift => gift.byNodeAccountId === user.address
        );
        const ungiftedMembers = members.filter(
            member => thisNodeGifts.find(
                gift => gift.forMemberAccountId === member.accountId
            ) === undefined && membersGiftedInThisProcess.indexOf(member.accountId) === -1
        );

        if (ungiftedMembers.length === 0) {
            // No members to gift, wait 1 second
            console.log("No members to gift, waiting 1 seconds...");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            // Create a gift for each ungifted member
            for (const member of ungiftedMembers) {
                // Generate 3D model, and personalized message
                const model = await generateModel(member.prompt);
                const message = await generateMessage(member.prompt);

                // Save .obj file to disk
                const tempFileName = randomId();
                fs.writeFileSync(
                    opts.directory + "/" + tempFileName + ".obj",
                    model
                );
                console.log("Generated message: " + message);
                console.log("Saved .obj file to " + tempFileName);

                // Upload .obj file to Cloud Storage
                await storage.bucket("pdc-public-data.bokov.me").upload(
                    opts.directory + "/" + tempFileName + ".obj",
                    {
                        destination: "models/" + tempFileName + ".obj"
                    }
                );

                // .obj file can be downloaded from this URL
                const storageUrl = `https://storage.googleapis.com/pdc-public-data.bokov.me/models/${tempFileName}.obj`;

                // Push the gift to the Smart Contract
                await contract.tx.pushNodeGift(
                    {
                        gasLimit,
                        storageDepositLimit
                    },
                    member.accountId,
                    storageUrl,
                    message
                ).signAndSend(user);

                // This is to make sure not to immediately gift the same member again
                membersGiftedInThisProcess.push(member.accountId);
            }
        }

    }

}

// Start the app
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