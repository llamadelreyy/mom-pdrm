import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  Container,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  Icon,
  Card,
  CardBody,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserTag } from 'react-icons/fa';
import { api } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('#fafbfc', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Ralat',
        description: 'Kata laluan tidak sepadan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.email || !formData.username || !formData.fullName) {
      toast({
        title: 'Ralat',
        description: 'Sila isi semua medan yang diperlukan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        full_name: formData.fullName
      });
      
      toast({
        title: 'Berjaya',
        description: 'Akaun anda telah didaftarkan',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa pendaftaran',
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
      py={12}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: useColorModeValue(
          'linear(135deg, rgba(2, 125, 250, 0.05), rgba(113, 128, 150, 0.05))',
          'linear(135deg, rgba(2, 125, 250, 0.1), rgba(113, 128, 150, 0.1))'
        ),
        pointerEvents: 'none',
      }}
    >
      <Container maxW="2xl" position="relative" zIndex={1}>
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
                bg={useColorModeValue('gray.50', 'gray.700')}
                shadow="lg"
                mb={2}
              >
                <Image
                  src="/asset/logo.png"
                  alt="PDRM Logo"
                  maxH="60px"
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
                  Daftar Akaun Baru
                </Heading>
                <Text color={textColor} fontSize="lg" fontWeight="500">
                  Cipta akaun untuk akses sistem transkripsi
                </Text>
              </VStack>

              {/* Form */}
              <Box as="form" onSubmit={handleSubmit} w="full">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color={textColor}>
                      Nama Pengguna
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaUserTag} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="namapengguna"
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
                      Nama Penuh
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaUser} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Nama Penuh Anda"
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
                </SimpleGrid>

                <VStack spacing={6} mb={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color={textColor}>
                      Alamat Emel
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaEnvelope} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
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

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                    <FormControl isRequired>
                      <FormLabel fontWeight="600" color={textColor}>
                        Kata Laluan
                      </FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaLock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Kata laluan"
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
                        Sahkan Kata Laluan
                      </FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaLock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Sahkan kata laluan"
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
                  </SimpleGrid>
                </VStack>

                <VStack spacing={6}>
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
                    loadingText="Sedang mendaftar..."
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
                  >
                    Daftar Akaun
                  </Button>

                  <Text color={textColor} fontSize="md">
                    Sudah mempunyai akaun?{' '}
                    <Link
                      as={RouterLink}
                      to="/login"
                      color="primary.500"
                      fontWeight="600"
                      _hover={{
                        color: 'primary.600',
                        textDecoration: 'underline',
                      }}
                    >
                      Log masuk di sini
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

export default Register;