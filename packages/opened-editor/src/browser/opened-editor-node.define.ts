import { URI, formatLocalize } from '@ali/ide-core-browser';
import { TreeNode, CompositeTreeNode, ITree } from '@ali/ide-components';
import { OpenedEditorService } from './services/opened-editor-tree.service';
import { IEditorGroup, IResource } from '@ali/ide-editor';

export type OpenedEditorData = IEditorGroup | IResource;

export class EditorFileRoot extends CompositeTreeNode {

  static is(node: EditorFileGroup | EditorFileRoot): node is EditorFileRoot {
    return !!node && (node as EditorFileGroup).name === 'root';
  }

  constructor(
    tree: OpenedEditorService,
    id?: number,
  ) {
    super(tree as ITree, undefined);
    // 根节点默认展开节点
    this.setExpanded();
    this._uid = id || this._uid;
    TreeNode.idToTreeNode.set(this._uid, this);
  }

  get name() {
    return 'root';
  }

  dispose() {
    super.dispose();
  }
}

// EditorFileGroup 节点不包含父节点, 同时默认为展开状态
export class EditorFileGroup extends CompositeTreeNode {
  static isEditorGroup(data: OpenedEditorData): data is IEditorGroup {
    return typeof (data as any).resources !== 'undefined';
  }

  static is(node: EditorFileGroup | EditorFile): node is EditorFileGroup {
    return !!node && !!(node as EditorFileGroup).group;
  }

  private groupIndex: number;

  constructor(
    tree: OpenedEditorService,
    public readonly group: IEditorGroup,
    parent: EditorFileRoot,
    id?: number,
  ) {
    super(tree as ITree, parent);
    this.groupIndex = this.group.index;
    this._uid = id || this._uid;
    TreeNode.idToTreeNode.set(this._uid, this);
    // 根节点默认展开节点
    this.setExpanded();
  }

  get name() {
    return formatLocalize('opened.editors.group.title', this.groupIndex + 1);
  }

  get tooltip() {
    return this.name;
  }

  dispose() {
    super.dispose();
  }
}

export class EditorFile extends TreeNode {
  constructor(
    tree: OpenedEditorService,
    public readonly resource: IResource,
    public tooltip: string,
    public readonly parent: CompositeTreeNode | undefined,
    id?: number,
  ) {
    super(tree as ITree, parent);
    this._uid = id || this._uid;
    TreeNode.idToTreeNode.set(this._uid, this);
  }

  get name() {
    return this.resource.name;
  }

  get uri() {
    return this.resource.uri;
  }

  dispose() {
    super.dispose();
  }
}