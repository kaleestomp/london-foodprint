import type L from 'leaflet';
import TemplateWrapper from '../TemplateWrapper/TemplateWrapper';
import CuisineIncludeSwitch from './CuisineIncludeSwitch/CuisineIncludeSwitch';
import CuisineFilterChips from './Chips/Chips';
import './CuisineFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const CuisineFilterPanel: React.FC<Props> = ({ mapRef }) => {
  void mapRef;

  return (
    <TemplateWrapper
      title="Cuisine"
      headerContent={(<CuisineIncludeSwitch />)}
    >
      <CuisineFilterChips mapRef={mapRef} />
    </TemplateWrapper>
  );
};

export default CuisineFilterPanel;
