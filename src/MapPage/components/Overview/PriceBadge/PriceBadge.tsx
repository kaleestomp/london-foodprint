import { PRICE_RANGE_FILTER_OPTIONS } from '../../../../context/SearchFiltersContext';
import useRequestPriceHistogram from '../../../request/useRequestPriceHistogram/useRequestPriceHistogram';
import getPriceHistRequestParams from '../../FilterTabs/PriceFilter/Input/getPriceHistRequestParams';
import SimpleBarGraph from './SimpleBarGraph/SimpleBarGraph';

const PriceBadge = () => {
  const requestParams = getPriceHistRequestParams();
  const { res } = useRequestPriceHistogram(requestParams);
  const countsByPrice = new Map(
    (res?.cost_histogram ?? []).map(({ cost, count }) => [cost, count]),
  );
  const values = PRICE_RANGE_FILTER_OPTIONS.map((price) => countsByPrice.get(price) ?? 0);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <SimpleBarGraph values={values} />
    </div>
  );
};

export default PriceBadge;