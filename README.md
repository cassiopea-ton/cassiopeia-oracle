This is the oracle cli that is used to communicate with Cassiopeia ecosystem.

Available options:

```
Usage: cassio [OPTIONS]...

Options:
  -v, --version                                  output the version number
  -c, --config <config>                          config path (default: "oracle-config.json")
  -h, --help                                     display help for command

Commands:
  withdraw <amount>                              withdraw profit
  register_oracle                                register oracle
  register_provider <url> <addr> <price> <type>  register provider
  unregister                                     unregister oracle
  run                                            run to send data automatically
  send <url> [type]                              send at once
  help [command]                                 display help for command

```
