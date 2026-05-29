import React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';

type LoadingProps = {
  loading?: boolean;
};
const Loading: React.FC<LoadingProps> = ({ loading }) => {
  return (
    <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={loading? loading : false}
    >
        <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default Loading;
