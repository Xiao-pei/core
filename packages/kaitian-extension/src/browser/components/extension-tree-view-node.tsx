import * as React from 'react';
import * as cls from 'classnames';
import * as styles from '../vscode/api/tree-view/tree-view-node.module.less';
import { TreeNode, CompositeTreeNode, INodeRendererProps, ClasslistComposite, PromptHandle, TreeNodeType } from '@ali/ide-components';
import { getIcon } from '@ali/ide-core-browser';
import { Loading } from '@ali/ide-core-browser/lib/components/loading';
import { ExtensionTreeNode, ExtensionCompositeTreeNode } from '../vscode/api/tree-view/tree-view.node.defined';

export interface ITreeViewNodeProps {
  item: any;
  defaultLeftPadding?: number;
  leftPadding?: number;
  decorations?: ClasslistComposite;
  onTwistierClick?: (ev: React.MouseEvent, item: TreeNode | CompositeTreeNode, type: TreeNodeType) => void;
  onClick: (ev: React.MouseEvent, item: TreeNode | CompositeTreeNode, type: TreeNodeType) => void;
  onContextMenu?: (ev: React.MouseEvent, item: TreeNode | CompositeTreeNode, type: TreeNodeType) => void;
  actions?: React.JSXElementConstructor<any>;
}

export type TreeViewNodeRenderedProps = ITreeViewNodeProps & INodeRendererProps;

export const TreeViewNode: React.FC<TreeViewNodeRenderedProps> = ({
  item,
  onClick,
  onContextMenu,
  itemType,
  leftPadding = 8,
  onTwistierClick,
  decorations,
  defaultLeftPadding = 8,
  actions: Actions,
}: TreeViewNodeRenderedProps) => {
  const handleClick = (ev: React.MouseEvent) => {
    if (itemType === TreeNodeType.TreeNode || itemType === TreeNodeType.CompositeTreeNode) {
      onClick(ev, item as ExtensionTreeNode, itemType);
    }
  };

  const handlerTwistierClick = (ev: React.MouseEvent) => {
    if (itemType === TreeNodeType.TreeNode || itemType === TreeNodeType.CompositeTreeNode) {
      if (onTwistierClick) {
        onTwistierClick(ev, item as ExtensionTreeNode, itemType);
      } else {
        onClick(ev, item as ExtensionTreeNode, itemType);
      }
    }
  };

  const handleContextMenu = (ev: React.MouseEvent) => {
    if (ev.nativeEvent.which === 0 || !onContextMenu) {
      return;
    }
    if (itemType === TreeNodeType.TreeNode || itemType === TreeNodeType.CompositeTreeNode) {
      onContextMenu(ev, item as ExtensionTreeNode, itemType);
    }
  };

  const isDirectory = itemType === TreeNodeType.CompositeTreeNode;
  const paddingLeft = isDirectory ? `${defaultLeftPadding + (item.depth || 0) * (leftPadding || 0)}px` : `${defaultLeftPadding + (item.depth || 0) * (leftPadding || 0) + 8}px`;

  const fileTreeNodeStyle = {
    height: TREE_VIEW_NODE_HEIGHT,
    lineHeight: `${TREE_VIEW_NODE_HEIGHT}px`,
    paddingLeft,
  } as React.CSSProperties;

  const renderFolderToggle = (node: ExtensionCompositeTreeNode | PromptHandle, clickHandler: any) => {
    if (decorations && decorations?.classlist.indexOf(styles.mod_loading) > -1) {
      return <Loading />;
    }
    return <div
      onClick={clickHandler}
      className={cls(
        styles.tree_view_node_segment,
        styles.expansion_toggle,
        getIcon('arrow-right'),
        { [`${styles.mod_collapsed}`]: !(node as ExtensionCompositeTreeNode).expanded },
      )}
    />;

  };

  const renderIcon = (node: ExtensionCompositeTreeNode | ExtensionTreeNode) => {
    return <div className={cls(styles.file_icon, node.icon)} style={{ height: TREE_VIEW_NODE_HEIGHT, lineHeight: `${TREE_VIEW_NODE_HEIGHT}px` }}>
    </div>;
  };

  const renderDisplayName = (node: ExtensionCompositeTreeNode | ExtensionTreeNode) => {
    return <div
      className={cls(styles.tree_view_node_segment, styles.tree_view_node_displayname)}
    >
      {node.name}
    </div>;
  };

  const renderStatusTail = () => {
    return <div className={cls(styles.tree_view_node_segment, styles.tree_view_node_tail)}>
      {renderInlineActions()}
    </div>;
  };

  const renderInlineActions = () => {
    if (Actions) {
      return <div className={styles.tree_view_actions}>
        <Actions />
      </div>;
    }
  };

  const renderTwice = (item) => {
    if (isDirectory) {
      return renderFolderToggle(item, handlerTwistierClick);
    }
  };

  const getItemTooltip = () => {
    const tooltip = item.tooltip;
    return tooltip || item.name;
  };

  const renderDescription = (node: ExtensionCompositeTreeNode | ExtensionTreeNode) => {
    return <div className={cls(styles.tree_view_node_segment_grow, styles.tree_view_node_description)}>
      {!node.name && !node.description ? '——' : node.description}
    </div>;
  };

  return (
    <div
      key={item.id}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={getItemTooltip()}
      className={cls(
        styles.tree_view_node,
        decorations ? decorations.classlist : null,
      )}
      style={fileTreeNodeStyle}
      draggable={itemType === TreeNodeType.TreeNode || itemType === TreeNodeType.CompositeTreeNode}
    >
      <div className={cls(styles.tree_view_node_content)}>
        {renderTwice(item)}
        {renderIcon(item)}
        <div
          className={styles.tree_view_node_overflow_wrap}
        >
          {renderDisplayName(item)}
          {renderDescription(item)}
        </div>
        {renderStatusTail()}
      </div>
    </div>
  );
};

export const TREE_VIEW_NODE_HEIGHT = 22;