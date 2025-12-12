import monsterLogo from "@/assets/brands/monster-energy.webp";
import smirnoffLogo from "@/assets/brands/smirnoff.png";
import gymsharkLogo from "@/assets/brands/gymshark.png";
import primeLogo from "@/assets/brands/prime.png";
import redbullLogo from "@/assets/brands/redbull.png";
import spotifyLogo from "@/assets/brands/spotify.png";

const brandLogos = [
  { name: 'Monster Energy', src: monsterLogo, height: 'h-12 md:h-14' },
  { name: 'Smirnoff', src: smirnoffLogo, height: 'h-14 md:h-16' },
  { name: 'GymShark', src: gymsharkLogo, height: 'h-8 md:h-10' },
  { name: 'Prime', src: primeLogo, height: 'h-10 md:h-14' },
  { name: 'Red Bull', src: redbullLogo, height: 'h-16 md:h-20' },
  { name: 'Spotify', src: spotifyLogo, height: 'h-8 md:h-10' },
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
