import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error) {
    console.warn('NOVA fallback activated:', error.message);
    this.props.onError?.();
  }
  render() {
    return this.state.error
      ? (this.props.fallback ?? null)
      : this.props.children;
  }
}
