import { render, screen } from '@testing-library/react';
import { CardBrandDetector } from '../CardBrandDetector';

describe('CardBrandDetector', () => {
  it('should render Visa logo and text', () => {
    render(<CardBrandDetector brand="visa" />);
    expect(screen.getByText('Visa')).toBeInTheDocument();
  });

  it('should render Mastercard logo and text', () => {
    render(<CardBrandDetector brand="mastercard" />);
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
  });

  it('should not render anything for unknown brand', () => {
    const { container } = render(<CardBrandDetector brand="unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardBrandDetector brand="visa" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
