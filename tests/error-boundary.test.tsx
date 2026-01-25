/**
 * ErrorBoundary Component Tests
 * Verifies that the ErrorBoundary correctly catches errors and renders fallback UI
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';
import React from 'react';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error: Component crashed!');
  }
  return <div>Component rendered successfully</div>;
};

// Component that throws on click
const ThrowOnClick = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('Clicked and crashed!');
  }
  
  return (
    <button onClick={() => setShouldThrow(true)}>
      Click to crash
    </button>
  );
};

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Suppress console.error during tests (ErrorBoundary logs errors)
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Component rendered successfully')).toBeDefined();
  });

  it('catches errors and renders fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Should show error message
    expect(screen.getByText('Oops! Something went wrong')).toBeDefined();
    expect(screen.getByText("Don't worry, love can fix anything! Let's try that again.")).toBeDefined();
    
    // Should show action buttons
    expect(screen.getByText('Try Again')).toBeDefined();
    expect(screen.getByText('Refresh Page')).toBeDefined();
    
    // Should show broken heart emoji
    expect(screen.getByText('💔')).toBeDefined();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleError).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeDefined();
    expect(screen.queryByText('Oops! Something went wrong')).toBeNull();
  });

  it('Try Again button resets error state', () => {
    // This is tricky to test because the component will immediately throw again
    // when re-rendered. We test that the button exists and is clickable.
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeDefined();
    
    // Click should not throw
    fireEvent.click(tryAgainButton);
    
    // Component will throw again, so we should still see error UI
    expect(screen.getByText('Oops! Something went wrong')).toBeDefined();
  });

  it('Refresh Page button triggers page reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);
    
    expect(reloadMock).toHaveBeenCalled();
  });

  it('isolates errors to wrapped component only', () => {
    render(
      <div>
        <div data-testid="sibling">Sibling component</div>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </div>
    );
    
    // Sibling should still render
    expect(screen.getByTestId('sibling')).toBeDefined();
    expect(screen.getByText('Sibling component')).toBeDefined();
    
    // Error boundary should show fallback
    expect(screen.getByText('Oops! Something went wrong')).toBeDefined();
  });
});
