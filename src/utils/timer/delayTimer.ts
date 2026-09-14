import { useState, useEffect } from 'react';

const delaySwitch = (
    boolValue: boolean, 
    delay: number = 200
) => {

const [delayedValue, setDelayedValue] = useState(boolValue);

    useEffect(() => {

        if (boolValue) {
            setDelayedValue(true);
            return;
        }

        const timer = window.setTimeout(() => setDelayedValue(false), delay);
        return () => window.clearTimeout(timer);
    }, [boolValue]);
    
    return delayedValue;
};

export default delaySwitch;