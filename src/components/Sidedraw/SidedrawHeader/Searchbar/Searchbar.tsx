import { useRef } from 'react';

// import IconButton from '@mui/material/IconButton'; 
import InputBase from '@mui/material/InputBase';
import InputAdornment from '@mui/material/InputAdornment'; 
import Paper from '@mui/material/Paper'; 
import SearchIcon from '@mui/icons-material/Search';
import './Searchbar.css';

const Searchbar = () => {
  const inputRef = useRef<HTMLInputElement>(null); 

  return (
    <Paper className="searchbar" elevation={0} variant="outlined">
      <InputAdornment position="start">
        <SearchIcon className="searchbar-icon" />
      </InputAdornment>
      <InputBase
        inputRef={inputRef}
        placeholder="Address Lookup"
        className="searchbar-input"
        onKeyDown={() => {}}
      />
    </Paper>
  );
}

export default Searchbar;
