import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Progress,
  Badge,
  HStack,
  Tooltip,
  Text,
} from '@chakra-ui/react';
import { FaDownload, FaTrash } from 'react-icons/fa';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'processing':
      return 'blue';
    case 'pending':
      return 'yellow';
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
      return 'Tidak Diketahui';
  }
};

const ReportTable = ({ reports = [], onDownload, onDelete }) => {
  if (!reports.length) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        Tiada laporan dijumpai
      </Text>
    );
  }

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Tajuk</Th>
          <Th>Status</Th>
          <Th>Tarikh</Th>
          <Th>Tindakan</Th>
        </Tr>
      </Thead>
      <Tbody>
        {reports.map((report) => (
          <Tr key={report.id || `${report.title}-${report.created_at}`}>
            <Td>{report.title}</Td>
            <Td>
              <Badge colorScheme={getStatusColor(report.status)}>
                {getStatusText(report.status)}
              </Badge>
            </Td>
            <Td>
              {report.created_at ? new Date(report.created_at).toLocaleDateString('ms-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </Td>
            <Td>
              <HStack spacing={2}>
                <Tooltip label="Muat Turun" hasArrow>
                  <IconButton
                    icon={<FaDownload />}
                    colorScheme="blue"
                    size="sm"
                    isDisabled={report.status !== 'completed'}
                    onClick={() => onDownload(report)}
                  />
                </Tooltip>
                <Tooltip label="Padam" hasArrow>
                  <IconButton
                    icon={<FaTrash />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => onDelete(report)}
                  />
                </Tooltip>
              </HStack>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default ReportTable;