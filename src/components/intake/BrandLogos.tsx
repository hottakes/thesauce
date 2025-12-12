import monsterLogo from "@/assets/brands/monster-energy.webp";
import smirnoffLogo from "@/assets/brands/smirnoff.png";
import gymsharkLogo from "@/assets/brands/gymshark.png";
import primeLogo from "@/assets/brands/prime.png";
import redbullLogo from "@/assets/brands/redbull.png";
import spotifyLogo from "@/assets/brands/spotify.png";

const brandLogos = [
  { name: 'Monster Energy', src: monsterLogo, height: 'h-6 md:h-8' },
  { name: 'Smirnoff', src: smirnoffLogo, height: 'h-8 md:h-10' },
  { name: 'GymShark', src: gymsharkLogo, height: 'h-5 md:h-6' },
  { name: 'Prime', src: primeLogo, height: 'h-8 md:h-10' },
  { name: 'Red Bull', src: redbullLogo, height: 'h-10 md:h-12' },
  { name: 'Spotify', src: spotifyLogo, height: 'h-6 md:h-8' },
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
            className={`${brand.height} w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 object-contain`}
          />
        ))}
      </div>
    </div>
  );
};
