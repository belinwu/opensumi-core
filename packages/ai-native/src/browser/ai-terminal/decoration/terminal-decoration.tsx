import React from 'react';
import ReactDOM from 'react-dom';
import { Terminal, IMarker, IDecoration } from 'xterm';

import { Injectable, Autowired } from '@opensumi/di';
import { localize } from '@opensumi/ide-core-browser';
import { Disposable } from '@opensumi/ide-core-common';
import { ITerminalController } from '@opensumi/ide-terminal-next';

import { AITerminaDebuglService } from '../ai-terminal-debug.service';
import { AiInlineWidgetForSelection, AiInlineWidgetForAutoDelect } from '../component/terminal-inline-chat-controller';
import { MatcherType } from '../matcher';

@Injectable()
export class AITerminalDecorationService extends Disposable {
  @Autowired(ITerminalController)
  private terminalController: ITerminalController;

  @Autowired(AITerminaDebuglService)
  private terminalDebug: AITerminaDebuglService;

  private decorationList: IDecoration[] = [];

  public active() {
    this.disposables.push(this.terminalController.onDidOpenTerminal(({ id }) => this.doSelectionDecoration(id)));
  }

  /**
   * Adds multiline decoration to the terminal.
   */
  addZoneDecoration(
    terminal: Terminal,
    marker: IMarker,
    height: number,
    buttonConfig: { text: string; onClick: () => void },
  ) {
    const decoration = terminal.registerDecoration({
      marker,
      width: terminal.cols,
      height,
    });

    if (!decoration) {
      // eslint-disable-next-line no-console
      console.error('Failed to create decoration for line', marker);
      return;
    }

    decoration.onRender((element) => {
      // 理论上 React 会确保 DOM 不被重复渲染
      ReactDOM.render(
        <AiInlineWidgetForAutoDelect
          options={[
            {
              id: 'debug',
              name: 'Debug',
              title: localize('ai.terminal.debug.title'),
            },
          ]}
          hanldeActions={() => {
            buttonConfig.onClick();
          }}
        />,
        element,
      );
    });
  }

  private doSelectionDecoration(clientId: string) {
    const client = this.terminalController.clients.get(clientId);
    const terminal = client?.term;
    if (!terminal) {
      return;
    }

    terminal.onSelectionChange(() => {
      const oldDecoration = this.decorationList.pop();
      if (oldDecoration) {
        setTimeout(() => {
          // 如果有旧的 decoration，先清除
          if (oldDecoration.element) {
            ReactDOM.unmountComponentAtNode(oldDecoration.element);
          }
          oldDecoration?.dispose();
          // this.selectionDecoration = undefined;
        }, 100);
      }
      const selection = terminal.getSelectionPosition();
      const selectionTextTrimed = terminal.getSelection().trim();

      if (selection && selectionTextTrimed.length > 0) {
        // 获取选区的右上角位置
        const endRow = selection.end.y;
        const startRow = selection.start.y;

        const cursorY2 = terminal.buffer.active.cursorY + terminal.buffer.active.baseY;
        const cursorYOffset = startRow - cursorY2;
        const selectionHeight = endRow - startRow + 1;

        // 注册一个装饰
        const marker = terminal.registerMarker(cursorYOffset);

        if (marker) {
          const selectionDecoration = terminal.registerDecoration({
            marker,
            width: terminal.cols,
            height: selectionHeight,
          });

          if (selectionDecoration) {
            selectionDecoration.onRender((element) => {
              // 创建右上角的 div 元素，用于当 React 容器

              ReactDOM.render(
                <AiInlineWidgetForSelection
                  options={[
                    {
                      id: 'explain',
                      name: 'Explain',
                      title: localize('ai.terminal.explain.title'),
                    },
                  ]}
                  hanldeActions={() => {
                    this.terminalDebug.debug(
                      {
                        type: MatcherType.base,
                        input: '',
                        errorText: selectionTextTrimed,
                        operate: 'explain',
                      },
                      'terminal-selection-explain',
                    );
                  }}
                />,
                element,
              );
            });

            // this.selectionDecoration.onDispose()
            this.decorationList.push(selectionDecoration);
          }
        }
      }
    });
  }
}
