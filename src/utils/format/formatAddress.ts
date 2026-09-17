export const formatAddress = (
    address: string | null | undefined,
    pcd: string | null | undefined,
): string | null => {

    if (!address)
        return address ?? null;
    //   const city = citySlug == 'london' ? 'London' 
    //     : citySlug == 'newcastle' ? 'Newcastle' 
    //     : null;

    const addressParts = address.split(', ');
    const cityPart = addressParts.length > 1 ? addressParts[addressParts.length - 1] : null;
    const formattedAddress = addressParts.length > 1
        ? addressParts.slice(0, -1).join(', ')
        : address;

    return pcd ? `${formattedAddress}\n${pcd} ${cityPart ?? ''}` : formattedAddress;
};

export default formatAddress;
