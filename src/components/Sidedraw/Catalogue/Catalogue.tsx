import { useState } from 'react';
import { useSelector } from 'react-redux';


import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
// import CardActionArea from '@mui/material/CardActionArea';

import type { DisplayCard } from '../useGetDisplayCards';
import './Catalogue.css'; 

interface CatalogueProps {
    cards: DisplayCard[];
}

const Catalogue = ({ cards }: CatalogueProps) => { 
  
  const currentOption = useSelector((state: any) => state.option.selected); 
  const loading = useSelector((state: any) => state.viewState.ready === false); 
  const loadedCardId = cards.find(card => `Project1/${String(card.id).padStart(2, '0')}` === currentOption)?.id; 
  const [selectedCard, _] = useState<number | null>(loadedCardId ?? null); 

  return (
    <Box className="catalogue" >
      {cards.map((card) => { 
        const loadStatus = loadedCardId !== card.id ? 'notLoaded' 
        : loading ? 'loading' : 'loaded'; 
        return (
          <Card key={card.id}
            className={`catalogue-card ${selectedCard === card.id ? 'catalogue-card-expanded' : ''}`} 
            style={ loadStatus === 'loaded' ? { backgroundColor: 'rgb(240, 240, 240)' } : {} }
          >
          </Card>
        )
      })}
    </Box>
  );
}

export default Catalogue;
