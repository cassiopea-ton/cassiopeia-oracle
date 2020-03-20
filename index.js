const commander = require("commander");
const fs = require("fs");
const execSync = require("child_process").execSync;
const axios = require("axios");

class DataRequester {
  static async getData(url) {
    let data = await axios.get(`https://${url}`);
    return data.data.last;
  }
}
class LiteClient {
  constructor(
    liteClientPath = "lite-client/lite-client",
    configPath = "lite-client/config.json",
    walletPath = "build/wallet",
    walletQuery = "build/wallet-query"
  ) {
    this.liteClientPath = liteClientPath;
    this.configPath = configPath;
    this.walletPath = walletPath;
    this.walletAddr = execSync(
      `fift -s ./fift_scripts/show-bouceable-addr.fif ${walletPath}`
    )
      .toString()
      .trim();
    this.walletQuery = walletQuery;
  }

  getSeqno(addr) {
    return this.getParam(addr, "seqno");
  }

  getParam(addr, method) {
    return execSync(
      `${this.liteClientPath} -v 0 -C ${this.configPath} -c 'runmethod ${addr} ${method}' |  grep 'remote result' | cut -d "[" -f2 | cut -d "]" -f1`
    )
      .toString()
      .trim();
  }

  static toGram(nanoGrams) {
    return nanoGrams / 10e9;
  }

  syncClient() {
    return execSync(
      `${this.liteClientPath} -v 0 -C ${this.configPath} -l /dev/null -c 'last'`
    ).toString();
  }

  broadcast(filePath = "build/wallet-query") {
    return execSync(
      `${this.liteClientPath} -v 0 -C ${this.configPath} -l /dev/null -c 'sendfile ${filePath}.boc'`
    ).toString();
  }

  execFift(scriptPath, args = []) {
    return execSync(`fift -s ${scriptPath}.fif ${args.join(" ")}`).toString();
  }
  sign(receiver, amount, boc) {
    return this.execFift("fift_scripts/wallet", [
      this.walletPath,
      receiver,
      this.getSeqno(this.walletAddr),
      amount,
      this.walletQuery,
      boc ? `-B "${boc}.boc"` : ""
    ]);
  }
}

async function main() {
  const program = new commander.Command();

  program
    .version("1.0.0", "-v, --version")
    .usage("[OPTIONS]...")
    .option("-c, --config <config>", "config path", "oracle-config.json");

  const config = JSON.parse(fs.readFileSync(program.config));
  let client = new LiteClient();

  program
    .command("withdraw <amount>")
    .description("withdraw profit")
    .action(amount => {
      client.execFift("fift_scripts/withdraw", [amount]);
      client.syncClient();
      client.sign(config.register, config.fee, "build/withdraw");
      client.broadcast();
      console.log(`${amount} nanograms withdrawn`);
    });

  program
    .command("register_oracle")
    .description("register oracle")
    .action(() => {
      client.execFift("fift_scripts/register-oracle");
      client.syncClient();
      client.sign(
        config.register,
        LiteClient.toGram(client.getParam(config.register, "getstake")),
        "build/register-oracle"
      );
      client.broadcast();
      console.log(`oracle registered`);
    });

  program
    .command("register_provider <url> <addr> <price> <type> ")
    .description("register provider")
    .action((url, addr, price, type) => {
      client.execFift("fift_scripts/register-provider", [
        url,
        addr,
        price,
        type
      ]);
      client.syncClient();
      client.sign(
        config.register,
        LiteClient.toGram(client.getParam(config.register, "getstake") * 100),
        "build/register-provider"
      );
      client.broadcast();
      console.log(`provider registered`);
    });

  program
    .command("unregister")
    .description("unregister oracle")
    .action(() => {
      console.log("unregister command called");
    });

  program
    .command("run")
    .description("run to send data automatically")
    .action(() => {
      console.log("run command called");
    });

  program
    .command("send <url> [type]")
    .description("send at once")
    .action(async (url, type = "0") => {
      let data = parseInt(await DataRequester.getData(url));
      client.execFift("fift_scripts/send-int-data", [url, data, type]);
      client.syncClient();
      client.sign(config.register, config.fee, "build/send-int-data");
      client.broadcast();
      console.log("data sent");
    });

  await program.parseAsync(process.argv);
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error(error);
  }
})();
