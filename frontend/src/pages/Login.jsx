import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Container,
  Image,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  Icon,
  Card,
  CardBody,
  Link,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { api } from '../utils/api.js';
import { setStoredValue } from '../utils/localStorage.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('#1f1b51', '#1f1b51');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)');
  const headingColor = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.600');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      setStoredValue('token', response.token);
      setStoredValue('name', response.name);
      navigate('/');
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa log masuk',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      bg={bgColor}
      align="center"
      justify="center"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: useColorModeValue(
          'linear(45deg, rgba(2, 125, 250, 0.05), rgba(113, 128, 150, 0.05))',
          'linear(45deg, rgba(2, 125, 250, 0.1), rgba(113, 128, 150, 0.1))'
        ),
        pointerEvents: 'none',
      }}
    >
      <Container maxW="md" position="relative" zIndex={1}>
        <Card
          boxShadow="2xl"
          borderRadius="3xl"
          bg={cardBg}
          border="1px"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          overflow="hidden"
        >
          <CardBody p={12}>
            <VStack spacing={8} w="full">
              {/* Logo Section */}
              <Box
                p={4}
                borderRadius="2xl"
                bg="rgba(31, 27, 81, 0.1)"
                shadow="lg"
              >
                <Image
                  src="/asset/logo.png"
                  alt="PDRM Logo"
                  maxH="80px"
                  objectFit="contain"
                />
              </Box>

              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading
                  size="xl"
                  color={headingColor}
                  fontWeight="800"
                  letterSpacing="tight"
                >
                  Selamat Datang
                </Heading>
                <Text color={textColor} fontSize="lg" fontWeight="500">
                  Log masuk ke sistem transkripsi
                </Text>
              </VStack>

              {/* Form */}
              <Box as="form" onSubmit={handleSubmit} w="full">
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color={textColor}>
                      Alamat Emel
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaEnvelope} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@contoh.com"
                        borderRadius="xl"
                        borderWidth="2px"
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px rgba(2, 125, 250, 0.6)',
                        }}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color={textColor}>
                      Kata Laluan
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata laluan"
                        borderRadius="xl"
                        borderWidth="2px"
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px rgba(2, 125, 250, 0.6)',
                        }}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="primary"
                    size="lg"
                    width="full"
                    height="56px"
                    fontSize="md"
                    fontWeight="700"
                    borderRadius="xl"
                    isLoading={isLoading}
                    loadingText="Sedang log masuk..."
                    bgGradient="linear(to-r, primary.500, primary.600)"
                    _hover={{
                      bgGradient: 'linear(to-r, primary.600, primary.700)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    mt={2}
                  >
                    Log Masuk
                  </Button>

                  <Text color={textColor} fontSize="md" textAlign="center" mt={4}>
                    Belum mempunyai akaun?{' '}
                    <Link
                      as={RouterLink}
                      to="/register"
                      color="primary.500"
                      fontWeight="600"
                      _hover={{
                        color: 'primary.600',
                        textDecoration: 'underline',
                      }}
                    >
                      Daftar di sini
                    </Link>
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Flex>
  );
};

export default Login;