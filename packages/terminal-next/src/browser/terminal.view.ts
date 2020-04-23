import { observable, computed } from 'mobx';
import { Injectable, Autowired } from '@ali/common-di';
import { Emitter, Disposable } from '@ali/ide-core-browser';
import { ITerminalGroupViewService, IWidget, ITerminalInternalService, userActionViewUuid, IWidgetGroup } from '../common';

export class Widget extends Disposable implements IWidget {
  protected _id: string;
  protected _group: WidgetGroup;
  protected _element: HTMLDivElement;

  @observable
  dynamic: number = 0;

  @observable
  shadowDynamic: number = 0;

  @observable
  name: string = '';

  constructor(id: string) {
    super();
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get group() {
    return this._group;
  }

  set group(g: WidgetGroup) {
    this._group = g;
    g.addWidget(this);
  }

  get element() {
    return this._element;
  }

  set element(ele: HTMLDivElement) {
    if (!this._element) {
      this._element = ele;
      this._onRender.fire();
    }
  }

  protected _onRender = new Emitter<void>();
  protected _onResize = new Emitter<void>();
  onRender = this._onRender.event;
  onResize = this._onResize.event;

  resize(dynamic?: number) {
    this.dynamic = dynamic || this.shadowDynamic;
    this.shadowDynamic = this.dynamic;
    this._onResize.fire();
  }

  increase(increment: number) {
    this.shadowDynamic += increment;
    this._onResize.fire();
  }
}

export class WidgetGroup extends Disposable implements IWidgetGroup {
  static whole = 100;
  static float = 1000;

  protected _id: string;
  protected _name: string;
  protected _activated: boolean;

  @observable
  widgets: Widget[] = [];

  @observable
  editable: boolean = false;

  @observable
  activated: boolean = false;

  @observable
  name: string = '';

  @observable
  currentId: string;

  widgetsMap: Map<string, Widget> = new Map();

  constructor(id?: string) {
    super();
    this._id = id || userActionViewUuid();
    this._activated = false;
  }

  get id() {
    return this._id;
  }

  get length() {
    return this.widgets.length;
  }

  get first() {
    return this.widgets[0];
  }

  get last() {
    return this.widgets[this.length - 1];
  }

  get current() {
    return this.widgetsMap.get(this.currentId);
  }

  @computed
  get snapshot() {
    if (this.name) {
      return this.name;
    } else {
      let name = '';
      const length = this.length;
      this.widgets.forEach((widget, index) => {
        name += `${widget.name}${index !== (length - 1) ? ', ' : ''}`;
      });
      return name;
    }
  }

  addWidget(widget: Widget) {
    this.widgets.push(widget);
    this.widgetsMap.set(widget.id, widget);

    this._averageLayout();
  }

  findWidget(widget: Widget) {
    return this.widgets.findIndex((item) => item.id === widget.id);
  }

  selectWidget(widget: Widget) {
    this.currentId = widget.id;
  }

  removeWidgetByIndex(index: number) {
    const widget = this.widgets.splice(index, 1);
    this.widgetsMap.delete(widget[0].id);
    this._averageLayout();

    if (this.last) {
      this.selectWidget(this.last);
    }

    return widget[0];
  }

  edit() {
    this.editable = true;
  }

  rename(name: string) {
    this.name = name;
    this.editable = false;
  }

  private _isLast(widget: Widget) {
    return widget.id === this.widgets[this.widgets.length - 1].id;
  }

  private _averageLayout() {
    const average = Math.round((WidgetGroup.whole / this.widgets.length)
      * WidgetGroup.float) / WidgetGroup.float;
    this.widgets.forEach((widget) => {
      if (this._isLast(widget)) {
        widget.resize(WidgetGroup.whole - average * (this.widgets.length - 1));
      } else {
        widget.resize(average);
      }
    });
  }
}

@Injectable()
export class TerminalGroupViewService implements ITerminalGroupViewService {
  protected _widgets: Map<string, Widget>;

  @observable
  groups: WidgetGroup[] = [];

  @observable
  currentGroupId: string;

  @observable
  currentGroupIndex: number;

  @Autowired(ITerminalInternalService)
  service: ITerminalInternalService;

  protected _onWidgetCreated = new Emitter<Widget>();
  protected _onWidgetSelected = new Emitter<Widget>();
  protected _onWidgetDisposed = new Emitter<Widget>();
  protected _onWidgetEmpty = new Emitter<void>();

  constructor() {
    this._widgets = new Map();
  }

  get currentGroup() {
    return this.groups[this.currentGroupIndex];
  }

  get currentWidget() {
    return this.getWidget(this.currentGroup.currentId);
  }

  get currentWidgetId() {
    return this.currentGroup && this.currentGroup.currentId;
  }

  onWidgetCreated = this._onWidgetCreated.event;
  onWidgetSelected = this._onWidgetSelected.event;
  onWidgetDisposed = this._onWidgetDisposed.event;
  onWidgetEmpty = this._onWidgetEmpty.event;

  getGroup(index: number): WidgetGroup {
    if (index > this.groups.length - 1) {
      throw new Error('out of groups length');
    }
    return this.groups[index];
  }

  private _doSelectGroup(index: number) {
    this.currentGroupIndex = index;
    this.currentGroupId = this.currentGroup && this.currentGroup.id;
  }

  selectGroup(index: number) {
    this._doSelectGroup(index);
    const group = this.getGroup(index);
    group.activated = true;
    if (group.current) {
      this._onWidgetSelected.fire(group.current);
    }
  }

  private _doCreateGroup(id?: string) {
    const group = new WidgetGroup(id);
    this.groups.push(group);
    return (this.groups.length - 1);
  }

  createGroup() {
    const index = this._doCreateGroup();
    this.getGroup(index);
    return index;
  }

  private _checkIfEmpty(index: number) {
    if (this.empty()) {
      this._onWidgetEmpty.fire();
    } else {
      if (index === this.currentGroupIndex) {
        this._doSelectGroup(this.groups.length - 1);
      }
      if (index < this.currentGroupIndex) {
        this._doSelectGroup(this.currentGroupIndex - 1);
      }
    }
  }

  private _doRemoveGroup(index: number) {
    const [ group ] = this.groups.splice(index, 1);

    if (group) {
      group.widgets.forEach((widget) => {
        this._widgets.delete(widget.id);
        widget.dispose();
        this._onWidgetDisposed.fire(widget);
      });
      group.dispose();
    }

    this._checkIfEmpty(index);
  }

  removeGroup(index: number) {
    this._doRemoveGroup(index);
  }

  getWidget(id: string) {
    const widget = this._widgets.get(id);

    if (!widget) {
      throw new Error('not find this widget');
    }

    return widget;
  }

  selectWidget(id: string) {
    const widget = this.getWidget(id);
    const group = widget.group;
    const index = this.groups.findIndex((g) => g.id === group.id);
    group.selectWidget(widget);
    this.selectGroup(index);
  }

  createWidget(group: WidgetGroup, id?: string) {
    const widget = new Widget(id || this.service.generateSessionId());
    this._widgets.set(widget.id, widget);
    widget.group = group;
    this._onWidgetCreated.fire(widget);
    return widget;
  }

  private _checkIfGroupEmpty(index: number) {
    const group = this.getGroup(index);
    if (group.length === 0) {
      this._doRemoveGroup(index);
    }
  }

  removeWidget(id: string) {
    const widget = this.getWidget(id);
    const group = widget.group;
    const groupIndex = this.groups.findIndex((g) => group.id === g.id);
    const index = group.findWidget(widget);
    group.removeWidgetByIndex(index);
    this._widgets.delete(id);
    widget.dispose();
    this._onWidgetDisposed.fire(widget);

    this._checkIfGroupEmpty(groupIndex);
  }

  resize() {
    this._widgets.forEach((widget) => {
      widget.resize();
    });
  }

  empty() {
    return this._widgets.size === 0;
  }

  clear() {
    this.groups = observable.array([]);
    this._widgets.clear();
    this._onWidgetEmpty.fire();
  }
}