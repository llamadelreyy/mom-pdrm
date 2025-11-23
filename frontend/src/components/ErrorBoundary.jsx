import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue
} from '@chakra-ui/react';

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
    
    // Log the error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={useColorModeValue('gray.50', 'gray.900')}
        >
          <VStack spacing={6} p={8} maxW="lg" textAlign="center">
            <Heading size="xl" color="red.500">
              Oops! Ralat Telah Berlaku
            </Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
              Maaf, sesuatu yang tidak dijangka telah berlaku. Sila muat semula halaman atau hubungi sokongan jika masalah berterusan.
            </Text>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Muat Semula Halaman
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Box
                mt={4}
                p={4}
                bg={useColorModeValue('gray.100', 'gray.700')}
                borderRadius="md"
                width="100%"
                overflowX="auto"
              >
                <Text color="red.500" fontFamily="monospace" fontSize="sm" whiteSpace="pre-wrap">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;