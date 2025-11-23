import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import TranscriptTable from '../components/TranscriptTable';
import ReportModal from '../components/ReportModal';
import { api } from '../utils/api';

const ManageTranscript = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [transcriptToDelete, setTranscriptToDelete] = useState(null);
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();
  const pollingRef = useRef({});
  const cancelRef = useRef();

  useEffect(() => {
    loadTranscripts();
    return () => {
      // Clean up polling intervals on unmount
      Object.values(pollingRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  const loadTranscripts = () => {
    try {
      const savedTranscripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      
      // Filter out any null or undefined transcripts
      const validTranscripts = savedTranscripts.filter(t => t && t.id);
      
      // Map the transcripts to include text property
      const mappedTranscripts = validTranscripts.map(transcript => ({
        ...transcript,
        text: transcript.text || '', // Keep existing text or initialize empty
        date: transcript.date || new Date().toISOString() // Ensure date exists
      }));
      
      setTranscripts(mappedTranscripts);
      
      // Start polling for any processing transcripts
      mappedTranscripts.forEach(transcript => {
        if (transcript.status === 'processing' || transcript.status === 'pending') {
          startPolling(transcript.id);
        }
      });
    } catch (error) {
      console.error('Error loading transcripts:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memuat transkrip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startPolling = (transcriptId) => {
    // Clear existing polling if any
    if (pollingRef.current[transcriptId]) {
      clearInterval(pollingRef.current[transcriptId]);
      delete pollingRef.current[transcriptId];
    }

    // Start new polling
    pollingRef.current[transcriptId] = setInterval(async () => {
      try {
        const status = await api.getTranscriptionStatus(transcriptId);
        updateTranscriptStatus(transcriptId, status);

        // Stop polling if completed or error
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(pollingRef.current[transcriptId]);
          delete pollingRef.current[transcriptId];

          // Show completion notification
          if (status.status === 'completed') {
            toast({
              title: 'Transkrip Selesai',
              description: `Transkrip telah selesai diproses`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });

            // Try to get the transcript text
            try {
              const transcript = await api.getTranscript(transcriptId);
              updateTranscriptText(transcriptId, transcript.text);
            } catch (error) {
              console.error('Error fetching transcript text:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking transcript status:', error);
        // Stop polling on error
        clearInterval(pollingRef.current[transcriptId]);
        delete pollingRef.current[transcriptId];

        // Update transcript status to completed if 404 (server restarted)
        if (error.message.includes('404')) {
          updateTranscriptStatus(transcriptId, { status: 'completed', progress: 100 });
        } else {
          // Otherwise mark as error
          updateTranscriptStatus(transcriptId, { status: 'error', progress: 0 });
        }
      }
    }, 1000);
  };

  const updateTranscriptStatus = (transcriptId, status) => {
    setTranscripts(prevTranscripts => {
      const updatedTranscripts = prevTranscripts.map(t => 
        t.id === transcriptId 
          ? { ...t, status: status.status, progress: status.progress }
          : t
      );
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      return updatedTranscripts;
    });
  };

  const updateTranscriptText = (transcriptId, text) => {
    setTranscripts(prevTranscripts => {
      const updatedTranscripts = prevTranscripts.map(t => 
        t.id === transcriptId 
          ? { ...t, text }
          : t
      );
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      return updatedTranscripts;
    });
  };

  const handleEdit = async (transcript) => {
    try {
      // First try to get the text from localStorage
      const savedTranscripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      const savedTranscript = savedTranscripts.find(t => t.id === transcript.id);
      
      if (savedTranscript && savedTranscript.text) {
        setSelectedTranscript(transcript);
        setEditingText(savedTranscript.text);
        onEditOpen();
      } else {
        // If not in localStorage, try to get from server
        const response = await api.getTranscript(transcript.id);
        setSelectedTranscript(transcript);
        setEditingText(response.text || '');
        
        // Update localStorage with the text
        updateTranscriptText(transcript.id, response.text || '');
        onEditOpen();
      }
    } catch (error) {
      console.error('Error preparing transcript edit:', error);
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa memuat transkrip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTranscript) return;

    try {
      // Update local storage first
      updateTranscriptText(selectedTranscript.id, editingText);

      // Try to update on server
      await api.updateTranscript(selectedTranscript.id, editingText);

      toast({
        title: 'Berjaya',
        description: 'Transkrip telah dikemaskini',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
    } catch (error) {
      console.error('Error updating transcript:', error);
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa menyimpan transkrip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (transcript) => {
    setTranscriptToDelete(transcript);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!transcriptToDelete) return;

    try {
      // Remove from localStorage first
      const updatedTranscripts = transcripts.filter(t => t.id !== transcriptToDelete.id);
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      setTranscripts(updatedTranscripts);

      // Then try to delete from server
      await api.deleteTranscript(transcriptToDelete.id);

      toast({
        title: 'Berjaya',
        description: 'Transkrip telah dipadam',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting transcript:', error);
      
      // If server delete fails, show warning but keep local deletion
      toast({
        title: 'Perhatian',
        description: 'Transkrip telah dipadam dari paparan tetapi mungkin masih wujud di pelayan',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setTranscriptToDelete(null);
    }
  };

  const handleGenerateReport = async (data) => {
    try {
      const blob = await api.generateReport(data.transcriptId, data.prompt);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.docx`;
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
      
      onReportClose();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa menjana laporan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={6}>Urus Transkrip</Heading>
      </Box>

      <TranscriptTable
        transcripts={transcripts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerateReport={(transcript) => {
          setSelectedTranscript(transcript);
          onReportOpen();
        }}
      />

      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sunting Transkrip</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              size="lg"
              rows={15}
            />
            <Button
              colorScheme="blue"
              mr={3}
              mt={4}
              onClick={handleSaveEdit}
            >
              Simpan
            </Button>
            <Button onClick={onEditClose} mt={4}>Batal</Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Padam Transkrip
            </AlertDialogHeader>

            <AlertDialogBody>
              Adakah anda pasti mahu memadam transkrip ini? Tindakan ini tidak boleh dibatalkan.
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

      <ReportModal
        isOpen={isReportOpen}
        onClose={onReportClose}
        transcript={selectedTranscript}
        onGenerateReport={handleGenerateReport}
      />
    </VStack>
  );
};

export default ManageTranscript;