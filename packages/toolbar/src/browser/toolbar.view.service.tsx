import { observable } from 'mobx';
import { Injectable, Autowired } from '@ali/common-di';
import { Disposable, IToolbarRegistry, createToolbarActionBtn, ToolbarActionBtnClickEvent } from '@ali/ide-core-browser';
import { IEventBus } from '@ali/ide-core-common';
import * as React from 'react';

import { IToolBarViewService, ToolBarPosition, IToolBarElementHandle, IToolBarAction, IToolBarComponent } from './types';

const locationToString = {
  [ToolBarPosition.LEFT]: 'toolbar-left',
  [ToolBarPosition.RIGHT]: 'toolbar-right',
  [ToolBarPosition.CENTER]: 'toolbar-center',
};

@Injectable()
export class ToolBarViewService implements IToolBarViewService {

  @Autowired(IToolbarRegistry)
  registry: IToolbarRegistry;

  @Autowired(IEventBus)
  eventBus: IEventBus;

  private anonymousId = 0;

  registerToolBarElement(element: IToolBarAction | IToolBarComponent) {
    const handle = new ToolBarElementHandle(element);
    const location = locationToString[element.position];

    const id = element.id || 'toolbar-anonymous-element-' + this.anonymousId++;

    if (element.type === 'action') {
      handle.addDispose(this.registry.registerToolbarAction({
        component: createToolbarActionBtn({
          title: element.title,
          iconClass: element.iconClass,
          id,
          delegate: ((d) => {
            d?.onClick((e) => {
              element.click(e);
            });
          }),
        }),
        id,
        weight: 10 - (element.order || 10),
        preferredPosition: {
          location,
        },
      }));
      handle.addDispose(this.eventBus.on(ToolbarActionBtnClickEvent, (e) => {
        if (e.payload.id === id) {
          element.click(e.payload.event);
        }
      }));
    } else {
      handle.addDispose(this.registry.registerToolbarAction({
        component: () => {
          return <element.component {...element.initialProps} />;
        },
        id,
        preferredPosition: {
          location,
        },
      }));
    }

    return handle;
  }

  /**
   * @deprecated
   */
  getVisibleElements(position: ToolBarPosition): (IToolBarComponent | IToolBarAction)[] {
    // const index = mappedIndex[position];
    // if (index === undefined) {
    //   getDebugLogger('Toolbar').warn('getVisibleElements with invalid position:', position);
    //   return [];
    // }
    // return this.elements[index]
    //   .filter((handle) => handle.visible)
    //   .map((handle) => handle.element);
    return [];
  }
}

export class ToolBarElementHandle extends Disposable implements IToolBarElementHandle {

  @observable
  public visible: boolean = true;

  constructor(public readonly element: IToolBarAction | IToolBarComponent) {
    super();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
  }
}