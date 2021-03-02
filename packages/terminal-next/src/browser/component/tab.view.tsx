import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useInjectable } from '@ali/ide-core-browser';
import { ITerminalGroupViewService, ITerminalRenderProvider } from '../../common';
import TabItem from './tab.item';
import { TerminalContextMenuService } from '../terminal.context-menu';

import * as styles from './tab.module.less';

export default observer(() => {
  const view = useInjectable<ITerminalGroupViewService>(ITerminalGroupViewService);
  const provider = useInjectable<ITerminalRenderProvider>(ITerminalRenderProvider);
  const menuService = useInjectable<TerminalContextMenuService>(TerminalContextMenuService);

  return (
    <div className={ styles.view_container }>
      {
        view.groups.map((group, index) => {
          if (!group) {
            return;
          }
          return (
            <TabItem
              key={ group.id }
              id={ group.id }
              editable={ group.editable }
              name={ group.snapshot || 'init...' }
              selected={ view.currentGroup && view.currentGroup.id === group.id }
              onInputBlur={ () => group.unedit() }
              onInputEnter={ (_: string, name: string) => group.rename(name) }
              onClick={ () => view.selectGroup(index) }
              onClose={ () => view.removeGroup(index) }
              onContextMenu={ (event) => menuService.onTabContextMenu(event, index) }
              provider={ provider }
            ></TabItem>
          );
        })
      }
    </div>
  );
});
