import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  useColorModeValue,
  Text,
  Box,
  Icon,
  Flex,
  Badge,
  Divider,
  HStack,
  Circle,
} from '@chakra-ui/react';
import { FaMicrophone, FaFileAudio } from 'react-icons/fa';

const TranscribeModal = ({ isOpen, onClose, selectedFile, onTranscribe }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // All useColorModeValue hooks must be called at the top level
  const overlayBg = useColorModeValue('rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)');
  const contentBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const closeBtnHoverBg = useColorModeValue('gray.100', 'gray.700');
  const fileInfoBg = useColorModeValue('gray.50', 'gray.700');
  const fileIconBg = useColorModeValue('blue.50', 'blue.900');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const processBg = useColorModeValue('blue.50', 'blue.900');
  const processBorder = useColorModeValue('blue.200', 'blue.700');
  const cancelBtnHoverBg = useColorModeValue('gray.50', 'gray.700');
  const primaryBg = useColorModeValue('primary.50', 'primary.900');

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Ralat',
        description: 'Sila masukkan tajuk untuk transkrip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onTranscribe({
        fileId: selectedFile.id,
        title: title,
        maxWorkers: 6,
        modelName: 'Whisper Malaysia',
        language: 'auto'
      });
      
      toast({
        title: 'Transkripsi Bermula',
        description: 'Transkripsi bermula, sila semak halaman urus transkrip untuk melihat progres',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setTitle('');
      onClose();
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa memproses transkripsi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg={overlayBg} backdropFilter="blur(10px)" />
      <ModalContent
        bg={contentBg}
        borderRadius="2xl"
        boxShadow="2xl"
        border="1px"
        borderColor={borderColor}
        mx={4}
      >
        <ModalHeader
          fontSize="xl"
          fontWeight="800"
          color={headerTextColor}
          pb={2}
        >
          <HStack spacing={3}>
            <Circle
              size="40px"
              bg={primaryBg}
              color="primary.500"
            >
              <Icon as={FaMicrophone} boxSize={5} />
            </Circle>
            <Box>
              <Text>Mulakan Transkripsi</Text>
              <Text fontSize="sm" fontWeight="500" color="gray.500" mt={1}>
                Tukar audio menjadi teks
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          borderRadius="lg"
          _hover={{
            bg: useColorModeValue('gray.100', 'gray.700'),
          }}
        />
        
        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* File Information */}
            {selectedFile && (
              <Box
                w="full"
                p={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderRadius="xl"
                border="1px"
                borderColor={borderColor}
              >
                <HStack spacing={3}>
                  <Circle
                    size="35px"
                    bg={useColorModeValue('blue.50', 'blue.900')}
                    color="blue.500"
                  >
                    <Icon as={FaFileAudio} boxSize={4} />
                  </Circle>
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs" borderRadius="full">
                        {getFileExtension(selectedFile.name)}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {formatFileSize(selectedFile.size)}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            )}

            <Divider />

            {/* Form */}
            <FormControl isRequired>
              <FormLabel
                fontWeight="600"
                color={useColorModeValue('gray.700', 'gray.300')}
                mb={3}
              >
                Tajuk Transkrip
              </FormLabel>
              <Input
                placeholder="Contoh: Mesyuarat Bulanan Januari 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="lg"
                borderRadius="xl"
                borderWidth="2px"
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: '0 0 0 1px rgba(2, 125, 250, 0.6)',
                }}
                bg={useColorModeValue('gray.50', 'gray.700')}
              />
              <Text fontSize="xs" color="gray.500" mt={2}>
                Berikan tajuk yang deskriptif untuk memudahkan pengenalan kemudian
              </Text>
            </FormControl>

            {/* Process Info */}
            <Box
              w="full"
              p={4}
              bg={useColorModeValue('blue.50', 'blue.900')}
              borderRadius="xl"
              border="1px"
              borderColor={useColorModeValue('blue.200', 'blue.700')}
            >
              <VStack spacing={2} align="start">
                <Text fontSize="sm" fontWeight="600" color="blue.600">
                  Maklumat Pemprosesan:
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Model: Whisper Malaysia (Bahasa Melayu & English)
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Mod: Pengesanan bahasa automatik
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Masa pemprosesan: Bergantung pada panjang audio
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Flex justify="space-between" w="full">
            <Button
              variant="outline"
              onClick={onClose}
              borderRadius="xl"
              px={6}
              _hover={{
                bg: useColorModeValue('gray.50', 'gray.700'),
              }}
            >
              Batal
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Memulakan..."
              borderRadius="xl"
              px={8}
              bgGradient="linear(to-r, primary.500, primary.600)"
              _hover={{
                bgGradient: 'linear(to-r, primary.600, primary.700)',
                transform: 'translateY(-1px)',
                boxShadow: 'lg',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.2s"
              leftIcon={<Icon as={FaMicrophone} />}
            >
              Mulakan Transkripsi
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TranscribeModal;