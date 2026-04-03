import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3 bg-white min-h-[200px]">
          <span className="text-4xl" aria-hidden="true">⚠️</span>
          <p className="text-sm font-semibold text-gray-700">
            {this.props.label || 'Etwas ist schiefgelaufen'}
          </p>
          <p className="text-xs text-gray-500 max-w-xs">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
