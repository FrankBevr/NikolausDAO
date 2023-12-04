import { GearApi, GearKeyring } from "@gear-js/api";
import { ProgramMetadata } from "@gear-js/api";
import { readFileSync } from 'fs'

async function geto() {
  /*Basics*/
  const gearApi = await GearApi.create({
    providerAddress: 'ws://127.0.0.1:9944',
  });
  // console.log(await gearApi.chain())
  // console.log(await gearApi.nodeName())
  // console.log(await gearApi.nodeVersion())
  // console.log(await gearApi.genesisHash.toHuman())

  /*Keyring*/
  const keyring = await GearKeyring.fromSuri('//Alice');
  // console.log(keyring.address)

  /*Subscribe*/

  /*Read meta*/

  /*Do sub*/
  const unsub = gearApi.gearEvents.subscribeToGearEvent(
    'UserMessageSent',
    ({
      data: {
        message: { id, source, destination, payload, value, reply },
      },
    }) => {

      /*****************************/
      /*********HERE****************/
      /*****************************/
      const metadata = ProgramMetadata.from("00020000000100000000010100000000000000000102000000c1022000082c74656d706c6174655f696f2050696e67506f6e670001081050696e6700000010506f6e670001000004082c74656d706c6174655f696f144672616e6b0001081841637469766500000020496e61637469766500010000080000020c000c00000408101c001010106773746418636f6d6d6f6e287072696d6974697665731c4163746f724964000004001401205b75383b2033325d0000140000032000000018001800000503001c0000050700")
      const decoded = metadata.createType(metadata.types.handle.output, payload)

      console.log(`
  messageId: ${id.toHex()}
  source: ${source.toHex()}
  payload: ${payload.toHuman()}
  de_payload: ${decoded}
  `);
    },
  );
  unsub
}

geto()
