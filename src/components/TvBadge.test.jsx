import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TvBadge from './TvBadge';

describe('TvBadge', () => {
  it('renders SVT badge correctly', () => {
    render(<TvBadge tv="SVT" />);
    const badge = screen.getByText('SVT');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#000030]');
    expect(badge).toHaveClass('text-white');
  });

  it('renders TV4 badge correctly', () => {
    render(<TvBadge tv="TV4" />);
    const badge = screen.getByText('TV4');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#E50000]');
    expect(badge).toHaveClass('text-white');
  });

  it('renders other channels with default style and icon', () => {
    render(<TvBadge tv="Discovery+" />);
    const badge = screen.getByText(/Discovery\+/);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-slate-100');
    // Check for the presence of the Lucide Tv icon (rendered as an svg)
    const icon = badge.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('handles empty or missing tv prop', () => {
    const { container } = render(<TvBadge tv="" />);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-slate-100');
  });
});
