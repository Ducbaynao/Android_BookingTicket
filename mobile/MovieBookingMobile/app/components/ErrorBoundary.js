import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to crash reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Icon name="error-outline" size={80} color="#FF6B6B" />
          <Text style={styles.title}>Oops! Có lỗi xảy ra</Text>
          <Text style={styles.message}>
            Ứng dụng gặp sự cố bất ngờ. Vui lòng thử lại.
          </Text>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              <Text style={styles.debugText}>
                {this.state.error && this.state.error.toString()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional error component for API errors
export const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry, 
  showRetry = true,
  style 
}) => (
  <View style={[styles.errorMessage, style]}>
    <Icon name="error-outline" size={40} color="#DC2626" />
    <Text style={styles.errorText}>{message}</Text>
    {showRetry && onRetry && (
      <TouchableOpacity 
        style={styles.smallRetryButton}
        onPress={onRetry}
      >
        <Text style={styles.smallRetryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Network error specific component
export const NetworkError = ({ onRetry }) => (
  <ErrorMessage
    message="Unable to connect to internet. Please check your network connection."
    onRetry={onRetry}
  />
);

// Server error component  
export const ServerError = ({ onRetry }) => (
  <ErrorMessage
    message="Server is busy. Please try again in a few minutes."
    onRetry={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  errorMessage: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
    textAlign: 'center',
  },
  smallRetryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  smallRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;