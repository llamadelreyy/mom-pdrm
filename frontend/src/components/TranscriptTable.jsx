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
  VStack,
  Progress,
  Badge,
  Center,
  useToast,
  Icon,
  Circle,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaFileAlt, FaEdit, FaFileExport, FaTrash } from 'react-icons/fa';

const TranscriptTable = ({ transcripts, onEdit, onGenerateReport, onDelete }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Tarikh tidak sah';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'processing':
        return 'Sedang Diproses';
      case 'pending':
        return 'Sedang Diproses';
      case 'error':
        return 'Ralat';
      default:
        return status;
    }
  };

  const handleDelete = (transcript) => {
    try {
      onDelete(transcript);
      toast({
        title: 'Berjaya',
        description: 'Transkrip telah dipadam',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memadam transkrip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!transcripts || transcripts.length === 0) {
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
            <Icon as={FaFileAlt} boxSize={16} color="gray.400" />
            <Text fontSize="lg" fontWeight="600" color="gray.500">
              Tiada transkrip dijumpai
            </Text>
            <Text fontSize="md" color="gray.400" textAlign="center">
              Mulakan proses transkripsi untuk melihat hasil di sini
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
                Transkrip
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
                Tarikh
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
                Status
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
            {transcripts.map((transcript, index) => (
              <Tr
                key={transcript.id}
                _hover={{ bg: hoverBg }}
                transition="all 0.2s"
                borderBottom="1px"
                borderBottomColor={borderColor}
              >
                <Td py={6}>
                  <HStack spacing={4}>
                    <Circle
                      size="40px"
                      bg={useColorModeValue(`${getStatusColor(transcript.status)}.50`, `${getStatusColor(transcript.status)}.900`)}
                      color={`${getStatusColor(transcript.status)}.500`}
                    >
                      <Icon as={FaFileAlt} boxSize={4} />
                    </Circle>
                    <VStack align="start" spacing={1}>
                      <Text
                        fontWeight="600"
                        fontSize="md"
                        color={useColorModeValue('gray.800', 'white')}
                        noOfLines={1}
                      >
                        {transcript.title}
                      </Text>
                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                        ID: {transcript.id}
                      </Text>
                    </VStack>
                  </HStack>
                </Td>
                <Td py={6}>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    {formatDate(transcript.date)}
                  </Text>
                </Td>
                <Td py={6}>
                  <VStack align="start" spacing={3}>
                    <Badge
                      colorScheme={getStatusColor(transcript.status)}
                      variant="subtle"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="700"
                    >
                      {getStatusText(transcript.status)}
                    </Badge>
                  </VStack>
                </Td>
                <Td py={6}>
                  <HStack spacing={3}>
                    <Tooltip
                      label="Sunting Transkrip"
                      placement="top"
                      hasArrow
                      bg="blue.500"
                    >
                      <IconButton
                        aria-label="Sunting"
                        icon={<Icon as={FaEdit} />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                        onClick={() => onEdit(transcript)}
                        isDisabled={transcript.status !== 'completed'}
                        _hover={{
                          transform: transcript.status === 'completed' ? 'translateY(-1px)' : 'none',
                          boxShadow: transcript.status === 'completed' ? 'md' : 'none',
                        }}
                        transition="all 0.2s"
                      />
                    </Tooltip>
                    <Tooltip
                      label="Jana Laporan"
                      placement="top"
                      hasArrow
                      bg="green.500"
                    >
                      <IconButton
                        aria-label="Jana Laporan"
                        icon={<Icon as={FaFileExport} />}
                        colorScheme="green"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                        onClick={() => onGenerateReport(transcript)}
                        isDisabled={transcript.status !== 'completed'}
                        _hover={{
                          transform: transcript.status === 'completed' ? 'translateY(-1px)' : 'none',
                          boxShadow: transcript.status === 'completed' ? 'md' : 'none',
                        }}
                        transition="all 0.2s"
                      />
                    </Tooltip>
                    <Tooltip
                      label="Padam Transkrip"
                      placement="top"
                      hasArrow
                      bg="red.500"
                    >
                      <IconButton
                        aria-label="Padam"
                        icon={<Icon as={FaTrash} />}
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                        onClick={() => handleDelete(transcript)}
                        _hover={{
                          transform: 'translateY(-1px)',
                          boxShadow: 'md',
                        }}
                        transition="all 0.2s"
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

export default TranscriptTable;