import { useCallback, useRef } from 'react';
import useCollapseTransition from './useCollapseTransition';
import useDropdownDisclosure from './useDropdownDisclosure';

const DEFAULT_WIDTH_TRANSITION_MS = 220;

const useGeoSearchbarAnimation = ({
  query, hasDropdownContent, onDropdownOpenChange,
  widthTransitionMs = DEFAULT_WIDTH_TRANSITION_MS,
}: {
  query: string;
  hasDropdownContent: boolean;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  widthTransitionMs?: number;
}): {
  rootRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showDropdown: boolean;
  reopenSearch: () => void;
  onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  closeDropdown: () => void;
} => {

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { isExpanded, showExpandedLayout, 
    reopenLayout, startCollapseAnimation } = useCollapseTransition({ transitionMs: widthTransitionMs });

  const collapseIfEmpty = useCallback(() => {
    if (query.trim().length === 0) startCollapseAnimation();
  }, [query, startCollapseAnimation]);

  const { showDropdown, openDropdownPanel, closeDropdown } = useDropdownDisclosure({
    rootRef, showExpandedLayout, isExpanded, hasDropdownContent,
    onDismissAfterClose: collapseIfEmpty, onDropdownOpenChange,
  });

  const reopenSearch = useCallback(() => {
    reopenLayout();
    openDropdownPanel();
  }, [openDropdownPanel, reopenLayout]);

  // const onExpand = useCallback(() => {
  //   reopenLayout();
  //   requestAnimationFrame(() => inputRef.current?.focus());
  // }, [reopenLayout]);

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback((event) => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    closeDropdown();
    collapseIfEmpty();
    inputRef.current?.blur();
  }, [closeDropdown, collapseIfEmpty]);

  return {
    rootRef,
    inputRef,
    showDropdown,
    reopenSearch,
    onInputKeyDown,
    closeDropdown,
  };
};

export default useGeoSearchbarAnimation;
