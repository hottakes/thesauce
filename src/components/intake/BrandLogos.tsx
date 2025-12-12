import { useState } from "react";

const brandLogos = [
  { name: 'Monster Energy', url: 'https://logo.clearbit.com/monsterenergy.com' },
  { name: 'Smirnoff', url: 'https://logo.clearbit.com/smirnoff.com' },
  { name: 'GymShark', url: 'https://logo.clearbit.com/gymshark.com' },
  { name: 'Prime', url: 'https://logo.clearbit.com/drinkprime.com' },
  { name: 'Red Bull', url: 'https://logo.clearbit.com/redbull.com' },
  { name: 'Spotify', url: 'https://logo.clearbit.com/spotify.com' },
];

export const BrandLogos = () => {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const handleError = (brandName: string) => {
    setFailedLogos(prev => new Set(prev).add(brandName));
  };

  return (
    <div className="w-full py-8">
      <p className="text-center text-sm text-muted-foreground mb-6">
        Brands we work with
      </p>
      <div className="flex items-center justify-center gap-8 md:gap-10 flex-wrap px-4">
        {brandLogos.map((brand) => (
          !failedLogos.has(brand.name) && (
            <img
              key={brand.name}
              src={brand.url}
              alt={brand.name}
              onError={() => handleError(brand.name)}
              className="h-6 md:h-8 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          )
        ))}
      </div>
    </div>
  );
};