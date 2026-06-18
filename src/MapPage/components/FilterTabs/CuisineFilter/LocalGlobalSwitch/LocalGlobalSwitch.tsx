import Typography from '@mui/material/Typography';
import PrimarySwitch from '../../../../../components/Switch/PrimarySwitch';
import './Switch.css';

type Props = {
    isGlobal: boolean;
    setIsGlobal: React.Dispatch<React.SetStateAction<boolean>>;
};

const LocalGlobalSwitch: React.FC<Props> = ({ isGlobal, setIsGlobal }) => {

    return (
        <div className="switch-row">
            <Typography variant="caption" className="switch-label switch-label--left">
                Local
            </Typography>
            <PrimarySwitch
                checked={isGlobal}
                onChange={(event) => setIsGlobal(event.target.checked)}
                slotProps={{ input: { 'aria-label': 'Toggle between local and city-wide cuisine chart' } }}
            />
            <Typography variant="caption" className="switch-label switch-label--right">
                City-wide
            </Typography>
        </div>
    );
};

export default LocalGlobalSwitch;
