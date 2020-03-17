const { TONClient } = require("ton-client-node-js");
const fs = require("fs");

let rawdata = fs.readFileSync("register.json");
let registerAbi = JSON.parse(rawdata);

let registerAddress = "kf8YzUcHNBGVjwkwE-sJZ19gOtQWNb2vwBsgg5FrT7iA88it";

async function main(client) {
  const localResponse = await client.contracts.runLocal({
    address: registerAddress,
    abi: {
      "ABI version": "1",
      "functions": [
        {
          "name": "getstake",
          "inputs": [],
          "outputs": [{ "name": "value0", "type": "uint32" }],
          "id": "0x1FF78"
        }
      ],
      "events": [],
      "data": []
    },
    functionName: 'getstake',
    input: {}
  });
}

(async () => {
  try {
    const client = new TONClient();
    client.config.setData({
      servers: ["test.ton.org/testnet"]
    });
    await client.setup();
    await main(client);
    process.exit(0);
  } catch (error) {
    console.error(error);
  }
})();
