import { MainThreadAPIIdentifier, IMainThreadCommands, IMainThreadLanguages } from '../../common';
import { MainThreadCommands } from './mainThreadCommands';
import { MainThreadExtensionDocumentData } from './doc.main.thread';
import { Injector } from '@ali/common-di';
import { VSCodeExtensionService } from '../types';
import { IRPCProtocol } from '@ali/ide-connection';
import { MainThreadLanguages } from './main.thread.language';

export function createApiFactory(
  rpcProtocol: IRPCProtocol,
  injector: Injector,
  extensionService: VSCodeExtensionService,
) {
  rpcProtocol.set<VSCodeExtensionService>(MainThreadAPIIdentifier.MainThreadExtensionServie, extensionService);
  rpcProtocol.set<IMainThreadCommands>(MainThreadAPIIdentifier.MainThreadCommands, injector.get(MainThreadCommands, [rpcProtocol]));
  rpcProtocol.set<IMainThreadLanguages>(MainThreadAPIIdentifier.MainThreadLanguages, injector.get(MainThreadLanguages, [rpcProtocol]));
  rpcProtocol.set<MainThreadExtensionDocumentData>(MainThreadAPIIdentifier.MainThreadDocuments, injector.get(MainThreadExtensionDocumentData, [rpcProtocol]));
}
