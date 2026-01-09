'use client';

const brandLogos = [
  { name: 'Monster Energy', src: '/brands/monster-energy.webp', height: 'h-12 md:h-14' },
  { name: 'Smirnoff', src: '/brands/smirnoff.png', height: 'h-16 md:h-20' },
  { name: 'GymShark', src: '/brands/gymshark.png', height: 'h-8 md:h-10' },
  { name: 'Prime', src: '/brands/prime.png', height: 'h-10 md:h-14' },
  { name: 'Red Bull', src: '/brands/redbull.png', height: 'h-20 md:h-24' },
  { name: 'Spotify', src: '/brands/spotify.png', height: 'h-8 md:h-10' },
];

export const BrandLogos = () => {
  return (
    <div className="w-full py-8">
      <p className="text-center text-sm text-muted-foreground mb-6">
        Brands we work with
      </p>
      <div className="flex items-center justify-center gap-8 md:gap-10 flex-wrap px-4">
        {brandLogos.map((brand) => (
          <img
            key={brand.name}
            src={brand.src}
            alt={brand.name}
            className={`${brand.height} w-auto object-contain`}
          />
        ))}
      </div>
    </div>
  );
};
