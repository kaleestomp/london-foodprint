import { useCallback, useEffect, useState, type RefObject } from 'react';

type Params = {
  rootRef: RefObject<HTMLDivElement | null>;
  isExpandedLayout: boolean;
  isExpanded: boolean;
  hasDropdownContent: boolean;
  onDismissAfterClose: () => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
};

type Result = {
  openDropdown: boolean;
  showDropdown: boolean;
  openDropdownPanel: () => void;
  closeDropdown: () => void;
};

const useDropdownDisclosure = ({
  rootRef,
  isExpandedLayout,
  isExpanded,
  hasDropdownContent,
  onDismissAfterClose,
  onDropdownOpenChange,
}: Params): Result => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const showDropdown = isExpanded && openDropdown && hasDropdownContent;

  const openDropdownPanel = useCallback(() => {
    setOpenDropdown(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(false);
  }, []);

  useEffect(() => {
    if (!isExpandedLayout) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
        onDismissAfterClose();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [closeDropdown, isExpandedLayout, onDismissAfterClose, rootRef]);

  useEffect(() => {
    onDropdownOpenChange?.(showDropdown);
  }, [onDropdownOpenChange, showDropdown]);

  return {
    openDropdown,
    showDropdown,
    openDropdownPanel,
    closeDropdown,
  };
};

export default useDropdownDisclosure;
