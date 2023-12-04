import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import { BN, BN_ONE } from "@polkadot/util";
import { readFileSync } from 'node:fs'

async function readGetLeader() {
  const wsProvider = new WsProvider();
  const api = new ApiPromise({ provider: wsProvider })

  await api.isReady;

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  api.registry.createType('WeightV2', {
    regTime: new BN(5_000_000_000_000).isub(BN_ONE),
    proofSize: new BN(1_000_000)
  });
  const storageDepositLimit = null;

  const CONTRACT_METADATA = readFileSync("./nikolaus_dao.json", "utf-8")
  const ADDRESS = "5Fvx51VbGM4mgoYvLZk3fWVX4cp713ihdBFk2nBJehXebadX"
  const contract = new ContractPromise(api, CONTRACT_METADATA, ADDRESS);

  const { result } = await contract.query.getLeader(
    alice.address,
    {
      gasLimit: api.registry.createType("WeightV2", {
        refTime: new BN("10000000000"),
        proofSize: new BN("10000000000"),
      }),
      storageDepositLimit,
    },
  );
  console.log(result.toHuman());
}

readGetLeader()
