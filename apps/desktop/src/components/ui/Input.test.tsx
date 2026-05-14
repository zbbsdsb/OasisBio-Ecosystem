import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders correctly with placeholder', () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('updates value when user types', () => {
    render(<Input placeholder="Test" />);
    const input = screen.getByPlaceholderText('Test');
    
    fireEvent.change(input, { target: { value: 'Hello World' } });
    expect(input).toHaveValue('Hello World');
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies error styles when error prop is provided', () => {
    const { container } = render(<Input error="This is an error" />);
    expect(container.firstChild).toHaveClass('border-red-500');
  });

  it('shows error message when error prop is provided', () => {
    render(<Input error="This is an error message" />);
    expect(screen.getByText('This is an error message')).toBeInTheDocument();
  });
});
