import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import ReportTable from '../components/ReportTable.jsx';
import { api } from '../utils/api.js';

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [reportToDelete, setReportToDelete] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();
  const cancelRef = useRef();
  const pollingIntervalsRef = useRef({});

  useEffect(() => {
    loadReports();
    return () => {
      // Clean up polling intervals on unmount
      Object.values(pollingIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  const loadReports = async () => {
    try {
      const reportsList = await api.listReports();
      setReports(reportsList);

      // Start polling for any processing reports
      reportsList.forEach(report => {
        if (report.status === 'processing' || report.status === 'pending') {
          startPolling(report.id);
        }
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memuat senarai laporan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startPolling = (reportId) => {
    // Clear existing polling if any
    if (pollingIntervalsRef.current[reportId]) {
      clearInterval(pollingIntervalsRef.current[reportId]);
      delete pollingIntervalsRef.current[reportId];
    }

    // Start new polling
    pollingIntervalsRef.current[reportId] = setInterval(async () => {
      try {
        const status = await api.getReportProgress(reportId);
        updateReportStatus(reportId, status);

        // Stop polling if completed or error
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(pollingIntervalsRef.current[reportId]);
          delete pollingIntervalsRef.current[reportId];

          // Show completion notification
          if (status.status === 'completed') {
            toast({
              title: 'Laporan Selesai',
              description: 'Laporan telah selesai dijana',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (error) {
        console.error('Error checking report status:', error);
        clearInterval(pollingIntervalsRef.current[reportId]);
        delete pollingIntervalsRef.current[reportId];
      }
    }, 1000);
  };

  const updateReportStatus = (reportId, status) => {
    setReports(prevReports => 
      prevReports.map(report => 
        report.id === reportId
          ? { ...report, ...status }
          : report
      )
    );
  };

  const handleDownload = async (report) => {
    if (!report || !report.id) {
      toast({
        title: 'Ralat',
        description: 'ID laporan tidak sah',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const blob = await api.getReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title || 'laporan'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Berjaya',
        description: 'Laporan telah dimuat turun',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memuat turun laporan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (report) => {
    if (!report || !report.id) {
      toast({
        title: 'Ralat',
        description: 'ID laporan tidak sah',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setReportToDelete(report);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!reportToDelete || !reportToDelete.id) {
      onDeleteClose();
      setReportToDelete(null);
      return;
    }

    try {
      await api.deleteReport(reportToDelete.id);
      
      // Update local state
      setReports(prevReports => 
        prevReports.filter(report => report.id !== reportToDelete.id)
      );

      toast({
        title: 'Berjaya',
        description: 'Laporan telah dipadam',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memadam laporan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setReportToDelete(null);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={6}>Urus Laporan</Heading>
      </Box>

      <ReportTable
        reports={reports}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Padam Laporan
            </AlertDialogHeader>

            <AlertDialogBody>
              Adakah anda pasti mahu memadam laporan ini? Tindakan ini tidak boleh dibatalkan.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Batal
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Padam
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ManageReports;