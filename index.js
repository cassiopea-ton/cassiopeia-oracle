const commander = require("commander");
const { TONClient } = require("ton-client-node-js");
const fs = require("fs");
const execSync = require("child_process").execSync;

async function main(client) {
  const program = new commander.Command();

  program
    .version("1.0.0", "-v, --version")
    .usage("[OPTIONS]...")
    .option("-c, --config <config>", "config path", "oracle-config.json");

  const config = JSON.parse(fs.readFileSync(program.config));
  config.walletAddr = execSync(
    `fift -s ./fift_scripts/show-bouceable-addr.fif ${config.wallet}`
  )
    .toString()
    .trim();

  client.config.setData({
    servers: [config.network]
  });
  program
    .command("withdraw <amount>")
    .description("withdraw profit")
    .action(amount => {
      console.log("withdraw command called");
    });

  program
    .command("register")
    .description("register oracle")
    .action(() => {
      const outputName = "register-oracle";

      const seqno = execSync(
        `./lite-client/lite-client -v 0 -C ./lite-client/config.json -c 'runmethod ${config.walletAddr} seqno' |  grep 'remote result' | cut -d "[" -f2 | cut -d "]" -f1`
      )
        .toString()
        .trim();
      const stake =
        execSync(
          `./lite-client/lite-client -v 0 -C ./lite-client/config.json -c 'runmethod ${config.register} getstake' |  grep 'remote result' | cut -d "[" -f2 | cut -d "]" -f1`
        )
          .toString()
          .trim() /
          10e9 +
        0.2;
      execSync(
        `fift -s fift_scripts/register-oracle.fif ${config.wallet} ${config.register} ${seqno} ${stake} ${outputName}`
      ).toString();
      execSync(
        `./lite-client/lite-client -v 0 -C ./lite-client/config.json -l /dev/null -c 'last'`
      ).toString();
      execSync(
        `./lite-client/lite-client -v 0 -C ./lite-client/config.json -c 'sendfile ${outputName}.boc'`
      ).toString();
    });

  program
    .command("unregister")
    .description("unregister oracle")
    .action(amount => {
      console.log("unregister command called");
    });

  program
    .command("run")
    .description("run to send data automatically")
    .action(() => {
      console.log("run command called");
    });

  program
    .command("send <url>")
    .description("send at once")
    .action(amount => {
      console.log("send command called");
    });

  program.parse(process.argv);
}

(async () => {
  try {
    const client = new TONClient();

    await client.setup();
    await main(client);
    process.exit(0);
  } catch (error) {
    console.error(error);
  }
})();
