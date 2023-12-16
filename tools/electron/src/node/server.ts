/* eslint-disable no-console */
import inspector from 'inspector';
import net from 'net';

import { Deferred, LogLevel } from '@opensumi/ide-core-common';
import { DEFAULT_TRS_REGISTRY } from '@opensumi/ide-core-common/lib/const';
import { IServerAppOpts, ServerApp, NodeModule } from '@opensumi/ide-core-node';
import { parseArgv } from '@opensumi/ide-utils/lib/argv';
const argv = parseArgv(process.argv.slice(2));

export async function startServer(arg1: NodeModule[] | Partial<IServerAppOpts>) {
  const deferred = new Deferred<net.Server>();
  let opts: IServerAppOpts = {
    marketplace: {
      endpoint: DEFAULT_TRS_REGISTRY.ENDPOINT,
      showBuiltinExtensions: true,
      accountId: DEFAULT_TRS_REGISTRY.ACCOUNT_ID,
      masterKey: DEFAULT_TRS_REGISTRY.MASTER_KEY,
    },
    logLevel: LogLevel.Verbose,
  };
  if (Array.isArray(arg1)) {
    opts = {
      ...opts,
      modulesInstances: arg1,
    };
  } else {
    opts = {
      ...opts,
      ...arg1,
    };
  }

  const server = net.createServer();
  const listenPath = argv.listenPath;

  const serverApp = new ServerApp(opts);

  await serverApp.start(server);

  server.on('error', (err) => {
    deferred.reject(err);
    console.error('server error: ' + err.message);
    setTimeout(process.exit, 0, 1);
  });

  server.listen(listenPath, () => {
    console.log(`server listen on path ${listenPath}`);
    deferred.resolve(server);
  });

  openInspector();

  await deferred.promise;
}

function openInspector() {
  const url = inspector.url();
  if (url) {
    console.log(`inspector url: ${url}`);
    return;
  }

  inspector.open(10234);
  const inspectorUrl = inspector.url();
  console.log(`inspector url: ${inspectorUrl}`);
}
