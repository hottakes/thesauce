import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogos } from '@/components/intake/BrandLogos';

describe('BrandLogos', () => {
  it('renders the brand logos section', () => {
    render(<BrandLogos />);

    expect(screen.getByText('Brands we work with')).toBeInTheDocument();
  });

  it('renders all brand logos', () => {
    render(<BrandLogos />);

    const brandNames = ['Monster Energy', 'Smirnoff', 'GymShark', 'Prime', 'Red Bull', 'Spotify'];

    brandNames.forEach((name) => {
      expect(screen.getByAltText(name)).toBeInTheDocument();
    });
  });

  it('renders images with correct src paths', () => {
    render(<BrandLogos />);

    const monsterLogo = screen.getByAltText('Monster Energy');
    expect(monsterLogo).toHaveAttribute('src', '/brands/monster-energy.webp');

    const spotifyLogo = screen.getByAltText('Spotify');
    expect(spotifyLogo).toHaveAttribute('src', '/brands/spotify.png');
  });
});
