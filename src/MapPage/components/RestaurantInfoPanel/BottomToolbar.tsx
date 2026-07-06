import type { CSSProperties, FC } from 'react';

type Props = {
  isMobile: boolean;
  panelHeight: number;
  translateY: number;
};

const BottomToolbar: FC<Props> = ({ isMobile, panelHeight, translateY }) => {
  const toolbarOffset = isMobile
    ? Math.max(16, panelHeight - translateY + 10)
    : 30;
  const toolbarStyle: CSSProperties & Record<string, string | number> = {
    bottom: 0,
    '--bottom-toolbar-offset': `${toolbarOffset}px`,
  };

  return (
    <div
      className="restaurant-bottom-toolbar"
      style={toolbarStyle}
      aria-label="Map toolbar"
    />
  );
};

export default BottomToolbar;
