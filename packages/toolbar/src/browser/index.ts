import { Autowired, INJECTOR_TOKEN, Injectable, Injector, Provider } from '@opensumi/di';
import {
  AppConfig,
  BrowserModule,
  ClientAppContribution,
  ContributionProvider,
  Domain,
  IToolbarRegistry,
  ToolBarActionContribution,
} from '@opensumi/ide-core-browser';
import { ComponentContribution, ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout';
import { FrameworkKind, IExtensionsSchemaService } from '@opensumi/ide-core-common';

import { ToolBar } from './toolbar.view';
import { ToolBarViewService } from './toolbar.view.service';
import { IToolBarViewService, ToolBarContribution } from './types';
export * from './types';

@Injectable()
export class ToolbarModule extends BrowserModule {
  providers: Provider[] = [
    ToolBarModuleContribution,
    {
      token: IToolBarViewService,
      useClass: ToolBarViewService,
    },
  ];
  contributionProvider = ToolBarContribution;
}

@Domain(ComponentContribution, ClientAppContribution, ToolBarActionContribution)
export class ToolBarModuleContribution
  implements ComponentContribution, ClientAppContribution, ToolBarActionContribution
{
  @Autowired(AppConfig)
  config: AppConfig;

  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  @Autowired(ToolBarContribution)
  contributions: ContributionProvider<ToolBarContribution>;

  @Autowired(IExtensionsSchemaService)
  protected readonly extensionsPointService: IExtensionsSchemaService;

  registerComponent(registry: ComponentRegistry): void {
    registry.register('toolbar', {
      id: 'toolbar',
      component: ToolBar,
    });
  }

  onStart() {
    const tabbarService = this.injector.get(IToolBarViewService) as IToolBarViewService;
    this.contributions.run('registerToolBarElement', tabbarService);

    /**
     * 在这里根据是否是 electron 来给 preferredPosition location 或 strictPosition location 定义枚举项 snippet
     */
    const locationPointPath = (type: 'preferredPosition' | 'strictPosition') => [
      'toolbar',
      'properties',
      'actions',
      'items',
      'properties',
      type,
      'properties',
      'location',
    ];
    const appendData = {
      extensionPoint: '',
      frameworkKind: ['opensumi'] as FrameworkKind[],
      jsonSchema: {
        enum: this.config.isElectronRenderer
          ? ['toolbar-left', 'toolbar-right', 'toolbar-center']
          : ['menu-left', 'menu-right'],
      },
    };

    this.extensionsPointService.appendExtensionPoint(locationPointPath('preferredPosition'), appendData);
    this.extensionsPointService.appendExtensionPoint(locationPointPath('strictPosition'), appendData);
  }

  registerToolbarActions(registry: IToolbarRegistry) {
    registry.addLocation('toolbar-left');
    registry.addLocation('toolbar-center');
    registry.addLocation('toolbar-right');
  }
}
