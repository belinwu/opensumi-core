import {
  URI,
  Domain,
  getIcon,
  AppConfig,
  CommandService,
  COMMON_COMMANDS,
  CommandRegistry,
  PreferenceService,
  CommandContribution,
  IPreferenceSettingsService,
  ILogger,
  IClipboardService,
} from '@ali/ide-core-browser';
import { Autowired } from '@ali/common-di';
import {
  ITerminalController,
  ITerminalRestore,
  ITerminalGroupViewService,
  ITerminalSearchService,
  ITerminalApiService,
  TERMINAL_COMMANDS,
} from '../../common';
import { TerminalKeyBoardInputService } from '../terminal.input';

@Domain(CommandContribution)
export class TerminalCommandContribution implements CommandContribution {

  @Autowired(ITerminalController)
  protected readonly terminalController: ITerminalController;

  @Autowired(ITerminalGroupViewService)
  protected readonly view: ITerminalGroupViewService;

  @Autowired(ITerminalSearchService)
  protected readonly search: ITerminalSearchService;

  @Autowired(ITerminalRestore)
  protected readonly store: ITerminalRestore;

  @Autowired(ITerminalApiService)
  protected readonly terminalApi: ITerminalApiService;

  @Autowired(PreferenceService)
  protected readonly preference: PreferenceService;

  @Autowired(IPreferenceSettingsService)
  protected readonly settingService: IPreferenceSettingsService;

  @Autowired(CommandService)
  protected readonly commands: CommandService;

  @Autowired(AppConfig)
  protected readonly config: AppConfig;

  @Autowired()
  protected readonly terminalInput: TerminalKeyBoardInputService;

  @Autowired(ILogger)
  protected readonly logger: ILogger;

  @Autowired(IClipboardService)
  protected readonly clipboardService: IClipboardService;

  onReconnect() {
    this.terminalController.reconnect();
  }

  registerCommands(registry: CommandRegistry) {
    // 新建 tab
    registry.registerCommand({
      ...TERMINAL_COMMANDS.ADD,
      iconClass: getIcon('plus'),
    }, {
      execute: () => {
        const index = this.view.createGroup();
        const group = this.view.getGroup(index);
        this.view.createWidget(group);
        this.view.selectGroup(index);
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.OPEN_SEARCH,
      iconClass: getIcon('search'),
    }, {
      execute: () => {
        this.search.open();
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.SPLIT,
      iconClass: getIcon('embed'),
    }, {
      execute: () => {
        const group = this.view.currentGroup;
        const widget = this.view.createWidget(group);
        this.view.selectWidget(widget.id);
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.CLEAR,
    }, {
      execute: () => {
        this.view.clear();
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SEARCH_NEXT, {
      execute: () => {
        if (this.search.show) {
          this.search.search();
        } else {
          this.search.open();
        }
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.REMOVE,
      iconClass: getIcon('delete'),
    }, {
      execute: async (_: any, index: number) => {
        if (index !== -1) {
          this.view.removeGroup(index);
        }
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.OPEN_WITH_PATH, {
      execute: async (uri: URI) => {
        if (uri) {
          const client = await this.terminalApi.createTerminal({ cwd: uri.codeUri.fsPath });
          client.show();
        }
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.TAB_RENAME, {
      execute: async (_: any, index: number) => {
        const group = this.view.getGroup(index);
        if (group) {
          group.edit();
        }
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.SELECT_ALL_CONTENT,
    }, {
      execute: () => {
        const widgetId = this.view.currentWidgetId;
        const client = this.terminalController.findClientFromWidgetId(widgetId);
        if (client) {
          client.selectAll();
        }
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.CLEAR_CONTENT,
      iconClass: getIcon('clear'),
    }, {
      execute: () => {
        const current = this.view.currentWidgetId;
        const client = this.terminalController.findClientFromWidgetId(current);
        if (client) {
          client.clear();
        }
      },
    });

    registry.registerCommand({
      ...TERMINAL_COMMANDS.CLEAR_ALL_CONTENT,
    }, {
      execute: () => {
        this.terminalController.clearAllGroups();
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_ZSH, {
      execute: async () => {
        this.preference.set('terminal.type', 'zsh');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_BASH, {
      execute: async () => {
        this.preference.set('terminal.type', 'bash');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_SH, {
      execute: async () => {
        this.preference.set('terminal.type', 'sh');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_POWERSHELL, {
      execute: async () => {
        this.preference.set('terminal.type', 'powershell');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_CMD, {
      execute: async () => {
        this.preference.set('terminal.type', 'cmd');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.MORE_SETTINGS, {
      execute: async () => {
        this.commands.executeCommand(COMMON_COMMANDS.LOCATE_PREFERENCES.id, 'terminal');
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.COPY, {
      execute: async () => {
        const current = this.view.currentWidgetId;
        const client = this.terminalController.findClientFromWidgetId(current);
        if (client) {
          await this.clipboardService.writeText(client.getSelection());
        }
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.PASTE, {
      execute: async () => {
        const current = this.view.currentWidgetId;
        const client = this.terminalController.findClientFromWidgetId(current);
        if (client) {
          client.paste(await this.clipboardService.readText());
        }
      },
    });

    registry.registerCommand(TERMINAL_COMMANDS.SELECT_ALL, {
      execute: () => {
        const current = this.view.currentWidgetId;
        const client = this.terminalController.findClientFromWidgetId(current);
        if (client) {
          client.selectAll();
        }
      },
    });
  }
}
