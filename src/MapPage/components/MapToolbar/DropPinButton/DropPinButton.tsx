import IconButton from '@mui/material/IconButton';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import usePinCarry from './usePinCarry';
import { red } from '../../../../../utils/styling/Colors';
import './DropPinButton.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const DropPinButton: React.FC<Props> = ({ mapRef }) => {
  const { carrying, hoveringButton, cursorPos, buttonRef, handlePointerDown } = usePinCarry(mapRef);

  return (
    <>
      <IconButton
        ref={buttonRef}
        className={`map-toolbar-fab${carrying ? ' carrying' : ''}`}
        aria-label="Drop pin"
        onPointerDown={handlePointerDown}
        sx={{ '&:hover svg': { color: carrying ? '#d4d4d4' : red } }}
      >
        {carrying
          ? hoveringButton
            ? <FmdGoodIcon fontSize="medium" sx={{ color: '#d4d4d4' }} />
            : <ClearRoundedIcon fontSize="large" sx={{ color: red }} />
          : <FmdGoodIcon fontSize="medium" />}
      </IconButton>
      {carrying && (
        <div className="drop-pin-cursor" style={{ left: cursorPos.x, top: cursorPos.y }}>
          <FmdGoodIcon fontSize="large" sx={{ color: red }} />
        </div>
      )}
    </>
  );
};

export default DropPinButton;

