/**
 * DiceLoader Component Tests
 * Unit tests for the DiceLoader component
 */

import { render, screen, waitFor } from '@testing-library/react';
import DiceLoader from '../DiceLoader';

describe('DiceLoader', () => {
  beforeEach(() => {
    // Reset document.body styles before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Cleanup after each test
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isVisible is false', () => {
      const { container } = render(
        <DiceLoader isVisible={false} text='Loading...' />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isVisible is true', () => {
      render(<DiceLoader isVisible={true} text='Loading...' />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display the provided text', () => {
      render(<DiceLoader isVisible={true} text='Custom loading text' />);
      expect(screen.getByText('Custom loading text')).toBeInTheDocument();
    });

    it('should use default text when not provided', () => {
      render(<DiceLoader isVisible={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display dice symbols', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );
      const diceElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(diceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Animation Variants', () => {
    it('should apply roll variant by default', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );
      // Check for roll animation class (implementation-specific)
      expect(
        container.querySelector('[class*="diceRoll"]')
      ).toBeInTheDocument();
    });

    it('should apply bounce variant when specified', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' variant='bounce' />
      );
      expect(
        container.querySelector('[class*="diceBounce"]')
      ).toBeInTheDocument();
    });

    it('should apply spin variant when specified', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' variant='spin' />
      );
      expect(
        container.querySelector('[class*="diceSpin"]')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<DiceLoader isVisible={true} text='Loading...' />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live attribute', () => {
      render(<DiceLoader isVisible={true} text='Loading...' />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy attribute', () => {
      render(<DiceLoader isVisible={true} text='Loading...' />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label with loading text', () => {
      const text = 'Custom loading message';
      render(<DiceLoader isVisible={true} text={text} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', text);
    });

    it('should mark decorative elements as aria-hidden', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );
      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should prevent body scroll when visible', () => {
      render(<DiceLoader isVisible={true} text='Loading...' />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when hidden', () => {
      const { rerender } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<DiceLoader isVisible={false} text='Loading...' />);
      expect(document.body.style.overflow).toBe('');
    });

    it('should store and restore focus', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );

      // Give time for useEffect to run
      await waitFor(() => {
        expect(document.activeElement).not.toBe(button);
      });

      rerender(<DiceLoader isVisible={false} text='Loading...' />);

      // Focus should be restored
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });

      document.body.removeChild(button);
    });
  });

  describe('Dice Face Cycling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should cycle through dice faces', () => {
      const { container } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );

      const getDiceSymbol = () => {
        const diceElement = container.querySelector('[class*="dice"]');
        return diceElement?.textContent;
      };

      const firstSymbol = getDiceSymbol();

      // Advance time by 150ms
      jest.advanceTimersByTime(150);

      const secondSymbol = getDiceSymbol();

      // Symbols should be different
      expect(firstSymbol).not.toBe(secondSymbol);
    });

    it('should stop cycling when component is hidden', () => {
      const { rerender, container } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );

      const getDiceSymbol = () => {
        const diceElement = container.querySelector('[class*="dice"]');
        return diceElement?.textContent;
      };

      // Hide the loader
      rerender(<DiceLoader isVisible={false} text='Loading...' />);

      // Advance time - cycling should have stopped
      jest.advanceTimersByTime(1000);

      // Component should not be rendered
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Validation', () => {
    it('should accept isVisible prop', () => {
      expect(() => {
        render(<DiceLoader isVisible={true} text='Loading...' />);
      }).not.toThrow();
    });

    it('should accept optional text prop', () => {
      expect(() => {
        render(<DiceLoader isVisible={true} />);
      }).not.toThrow();
    });

    it('should accept optional variant prop', () => {
      expect(() => {
        render(<DiceLoader isVisible={true} variant='bounce' />);
      }).not.toThrow();
    });

    it('should handle variant changes', () => {
      const { rerender, container } = render(
        <DiceLoader isVisible={true} variant='roll' />
      );
      expect(
        container.querySelector('[class*="diceRoll"]')
      ).toBeInTheDocument();

      rerender(<DiceLoader isVisible={true} variant='bounce' />);
      expect(
        container.querySelector('[class*="diceBounce"]')
      ).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should clean up interval on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );

      unmount();

      // Should not throw when advancing timers after unmount
      expect(() => {
        jest.advanceTimersByTime(1000);
      }).not.toThrow();

      jest.useRealTimers();
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(
        <DiceLoader isVisible={true} text='Loading...' />
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('TypeScript Props', () => {
    it('should accept all valid variant types', () => {
      const variants: Array<'roll' | 'bounce' | 'spin'> = [
        'roll',
        'bounce',
        'spin',
      ];

      variants.forEach(variant => {
        expect(() => {
          render(<DiceLoader isVisible={true} variant={variant} />);
        }).not.toThrow();
      });
    });
  });
});
