import { Injectable, Autowired } from '@ali/common-di';
import { IMenuRegistry } from '@ali/ide-core-browser/lib/menu/next';
import { localize } from '@ali/ide-core-common';

import { VSCodeContributePoint, Contributes } from '../../../common';
import { IContributeMenubarItem } from '../../../common/kaitian/extension';

export type KtMenubarsSchema = IContributeMenubarItem[];

@Injectable()
@Contributes('menubars')
export class KtMenubarsContributionPoint extends VSCodeContributePoint<KtMenubarsSchema> {
  @Autowired(IMenuRegistry)
  private readonly menuRegistry: IMenuRegistry;

  schema = {
    description: localize('kaitianContributes.menubars', 'Contributes extension defined menubars'),
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: localize('kaitianContributes.menubars.id', 'The identifier of menubar item, used as menu-id'),
        },
        label: {
          type: 'string',
          description: localize('kaitianContributes.menubars.label', 'The label of menubar item'),
        },
        order: {
          type: 'number',
          description: localize('kaitianContributes.menubars.order', 'The order of  menubar item'),
        },
        nativeRole: {
          type: 'string',
          description: localize('kaitianContributes.menubars.order', 'The nativeRole of  menubar item'),
        },
      },
    },
  };

  contribute() {
    for (const menubarItem of this.json) {
      this.addDispose(this.menuRegistry.registerMenubarItem(
        menubarItem.id,
        {
          label: this.getLocalizeFromNlsJSON(menubarItem.label),
          order: menubarItem.order,
          nativeRole: menubarItem.nativeRole,
        },
      ));
    }
  }
}