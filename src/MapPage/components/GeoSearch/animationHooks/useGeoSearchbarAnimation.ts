import { useCallback, useRef } from 'react';
import useCollapseTransition from './useCollapseTransition';
import useDropdownDisclosure from './useDropdownDisclosure';

const DEFAULT_WIDTH_TRANSITION_MS = 220;

type Params = {
  query: string;
  hasDropdownContent: boolean;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  widthTransitionMs?: number;
};

type Result = {
  rootRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  expanded: boolean;
  isCollapsing: boolean;
  showExpandedLayout: boolean;
  showDropdown: boolean;
  reopenSearch: () => void;
  onExpand: () => void;
  onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  closeDropdown: () => void;
};

const useGeoSearchbarAnimation = ({
  query,
  hasDropdownContent,
  onDropdownOpenChange,
  widthTransitionMs = DEFAULT_WIDTH_TRANSITION_MS,
}: Params): Result => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    expanded,
    isCollapsing,
    showExpandedLayout,
    reopenLayout,
    startCollapseAnimation,
  } = useCollapseTransition({ transitionMs: widthTransitionMs });

  const maybeCollapseIfEmpty = useCallback(() => {
    if (query.trim().length > 0) {
      return;
    }
    startCollapseAnimation();
  }, [query, startCollapseAnimation]);

  const {
    showDropdown,
    openDropdownPanel,
    closeDropdown,
  } = useDropdownDisclosure({
    rootRef,
    isExpandedLayout: showExpandedLayout,
    isExpanded: expanded,
    hasDropdownContent,
    onDismissAfterClose: maybeCollapseIfEmpty,
    onDropdownOpenChange,
  });

  const reopenSearch = useCallback(() => {
    reopenLayout();
    openDropdownPanel();
  }, [openDropdownPanel, reopenLayout]);

  const onExpand = useCallback(() => {
    reopenLayout();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [reopenLayout]);

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback((event) => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    closeDropdown();
    maybeCollapseIfEmpty();
    inputRef.current?.blur();
  }, [closeDropdown, maybeCollapseIfEmpty]);

  return {
    rootRef,
    inputRef,
    expanded,
    isCollapsing,
    showExpandedLayout,
    showDropdown,
    reopenSearch,
    onExpand,
    onInputKeyDown,
    closeDropdown,
  };
};

export default useGeoSearchbarAnimation;
