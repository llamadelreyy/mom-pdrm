import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Box,
  useColorModeValue,
  Text,
  Tooltip,
  HStack,
  Badge,
  Icon,
  VStack,
  Center,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { FaFileAudio, FaMicrophone } from 'react-icons/fa';

const AudioTable = ({ audioFiles, onTranscribe, onDelete }) => {
  // All useColorModeValue hooks must be called at the top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  const nameColor = useColorModeValue('gray.800', 'white');
  const dateColor = useColorModeValue('gray.600', 'gray.400');
  const sizeColor = useColorModeValue('gray.700', 'gray.300');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  const getExtensionColor = (extension) => {
    switch (extension) {
      case 'MP3':
        return 'blue';
      case 'WAV':
        return 'green';
      case 'M4A':
        return 'purple';
      case 'FLAC':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (!audioFiles || audioFiles.length === 0) {
    return (
      <Box
        bg={bgColor}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        p={12}
        boxShadow="card"
      >
        <Center>
          <VStack spacing={4}>
            <Icon as={FaFileAudio} boxSize={16} color="gray.400" />
            <Text fontSize="lg" fontWeight="600" color="gray.500">
              Tiada fail audio dijumpai
            </Text>
            <Text fontSize="md" color="gray.400" textAlign="center">
              Muat naik fail audio untuk memulakan proses transkripsi
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      boxShadow="card"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'cardHover',
      }}
    >
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead bg={headerBg}>
            <Tr>
              <Th
                borderBottom="2px"
                borderBottomColor={borderColor}
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                py={6}
              >
                Nama Fail
              </Th>
              <Th
                borderBottom="2px"
                borderBottomColor={borderColor}
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                py={6}
              >
                Tarikh Muat Naik
              </Th>
              <Th
                borderBottom="2px"
                borderBottomColor={borderColor}
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                py={6}
              >
                Saiz
              </Th>
              <Th
                borderBottom="2px"
                borderBottomColor={borderColor}
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                py={6}
              >
                Tindakan
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {audioFiles.map((file, index) => (
              <Tr
                key={file.id}
                _hover={{ bg: hoverBg }}
                transition="all 0.2s"
                borderBottom="1px"
                borderBottomColor={borderColor}
              >
                <Td py={6}>
                  <HStack spacing={4}>
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg={iconBg}
                      color="blue.500"
                    >
                      <Icon as={FaFileAudio} boxSize={4} />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="600" fontSize="md" color={nameColor}>
                        {file.name}
                      </Text>
                      <Badge
                        colorScheme={getExtensionColor(getFileExtension(file.name))}
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                      >
                        {getFileExtension(file.name)}
                      </Badge>
                    </VStack>
                  </HStack>
                </Td>
                <Td py={6}>
                  <Text fontSize="sm" color={dateColor}>
                    {formatDate(file.uploadDate)}
                  </Text>
                </Td>
                <Td py={6}>
                  <Text fontSize="sm" fontWeight="600" color={sizeColor}>
                    {formatFileSize(file.size)}
                  </Text>
                </Td>
                <Td py={6}>
                  <HStack spacing={3}>
                    <Tooltip
                      label="Mulakan Transkripsi"
                      placement="top"
                      hasArrow
                      bg="primary.500"
                    >
                      <IconButton
                        aria-label="Transkrip"
                        icon={<Icon as={FaMicrophone} />}
                        colorScheme="primary"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                        _hover={{
                          transform: 'translateY(-1px)',
                          boxShadow: 'md',
                        }}
                        transition="all 0.2s"
                        onClick={() => onTranscribe(file)}
                      />
                    </Tooltip>
                    <Tooltip
                      label="Padam Fail Audio"
                      placement="top"
                      hasArrow
                      bg="red.500"
                    >
                      <IconButton
                        aria-label="Padam"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                        _hover={{
                          transform: 'translateY(-1px)',
                          boxShadow: 'md',
                        }}
                        transition="all 0.2s"
                        onClick={() => onDelete(file)}
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default AudioTable;