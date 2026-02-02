import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';
import FileUpload from '../components/FileUpload';
import AudioTable from '../components/AudioTable';
import TranscribeModal from '../components/TranscribeModal';
import { api } from '../utils/api';

const ManageAudio = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    try {
      const files = await api.listUploads();
      setAudioFiles(files.map(file => ({
        id: file.id,
        name: file.filename,
        size: file.size,
        uploadDate: file.upload_date
      })));
    } catch (error) {
      console.error('Error loading audio files:', error);
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memuat senarai fail audio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await api.uploadAudio(file);
      
      // Reload the audio files from the server to get the updated list
      await loadAudioFiles();

      toast({
        title: 'Berjaya',
        description: 'Fail audio telah dimuat naik',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa memuat naik fail',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (file) => {
    setFileToDelete(file);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    try {
      // For now, just remove from frontend list since there's no delete API endpoint
      // TODO: Add delete API endpoint on backend
      const updatedFiles = audioFiles.filter(f => f.id !== fileToDelete.id);
      setAudioFiles(updatedFiles);

      toast({
        title: 'Berjaya',
        description: 'Fail audio telah dipadam daripada senarai',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Ralat',
        description: 'Ralat semasa memadam fail',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFileToDelete(null);
      onDeleteClose();
    }
  };

  const handleTranscribe = async (data) => {
    try {
      // Start transcription and get the request ID
      const response = await api.transcribeAudio(data.fileId, data.title, {
        maxWorkers: data.maxWorkers || 6
      });

      // Create transcript entry with request_id
      const transcripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      const newTranscript = {
        id: response.request_id,
        title: data.title,
        fileId: data.fileId,
        status: 'pending',
        progress: 0,
        date: new Date().toISOString()
      };

      const updatedTranscripts = [...transcripts, newTranscript];
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));

      toast({
        title: 'Berjaya',
        description: 'Proses transkripsi telah dimulakan dengan pengesan bahasa automatik',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa memproses transkripsi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={6}>Urus Audio</Heading>
        <FileUpload
          onFileUpload={handleFileUpload}
          onProgress={handleUploadProgress}
          isUploading={isUploading}
          progress={uploadProgress}
        />
      </Box>

      <AudioTable
        audioFiles={audioFiles}
        onTranscribe={(file) => {
          setSelectedFile(file);
          onOpen();
        }}
        onDelete={handleDelete}
      />

      <TranscribeModal
        isOpen={isOpen}
        onClose={onClose}
        selectedFile={selectedFile}
        onTranscribe={handleTranscribe}
      />

      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        leastDestructiveRef={undefined}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              Padam Fail Audio
            </AlertDialogHeader>

            <AlertDialogBody>
              Adakah anda pasti mahu memadam fail audio ini?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Batal
              </Button>
              <Button colorScheme="red" ml={3} onClick={confirmDelete}>
                Padam
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </VStack>
  );
};

export default ManageAudio;