import React, { useState, useEffect } from 'react';
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
  Textarea,
  VStack,
  Text,
  useToast,
  Select,
  Divider,
  Box,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import { api } from '../utils/api.js';

const defaultPrompts = [
  {
    id: 1,
    text: 'Sila ringkaskan mesyuarat ini dalam format yang mudah dibaca dengan tajuk utama dan butiran penting.'
  },
  {
    id: 2,
    text: 'Senaraikan semua keputusan penting dan tindakan yang perlu diambil dari mesyuarat ini.'
  }
];

const ReportModal = ({ isOpen, onClose, transcript }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [savedPrompts, setSavedPrompts] = useState(defaultPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Load saved prompts from localStorage or use defaults
    try {
      const loadedPrompts = JSON.parse(localStorage.getItem('savedPrompts'));
      if (loadedPrompts && Array.isArray(loadedPrompts) && loadedPrompts.length > 0) {
        setSavedPrompts(loadedPrompts);
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
    }
  }, []);

  const handleSavePrompt = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Ralat',
        description: 'Sila masukkan arahan format',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newPrompts = [...savedPrompts, { id: Date.now(), text: prompt }];
    setSavedPrompts(newPrompts);
    localStorage.setItem('savedPrompts', JSON.stringify(newPrompts));
    setShowNewPrompt(false);
    setSelectedPrompt(prompt);

    toast({
      title: 'Berjaya',
      description: 'Arahan format telah disimpan',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeletePrompt = (id) => {
    const newPrompts = savedPrompts.filter(p => p.id !== id);
    setSavedPrompts(newPrompts);
    localStorage.setItem('savedPrompts', JSON.stringify(newPrompts));
    if (selectedPrompt === savedPrompts.find(p => p.id === id)?.text) {
      setSelectedPrompt('');
    }
  };

  const handlePromptSelect = (e) => {
    const value = e.target.value;
    setSelectedPrompt(value);
    if (value === 'new') {
      setShowNewPrompt(true);
      setPrompt('');
    } else {
      setShowNewPrompt(false);
      setPrompt(value);
    }
  };

  const handleGenerate = async () => {
    if (!title || (!prompt && !selectedPrompt)) {
      toast({
        title: 'Ralat',
        description: 'Sila isi semua maklumat yang diperlukan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Start report generation
      const { report_id } = await api.generateReport(
        transcript.id,
        selectedPrompt || prompt,
        title
      );

      toast({
        title: 'Laporan Bermula',
        description: 'Laporan sedang dijana, sila semak halaman urus laporan untuk melihat progres',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      handleClose();

    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      toast({
        title: 'Ralat',
        description: error.message || 'Ralat semasa menjana laporan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setTitle('');
    setPrompt('');
    setSelectedPrompt('');
    setShowNewPrompt(false);
    setIsGenerating(false);
    onClose();
  };

  const truncateText = (text) => {
    if (!text) return '';
    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Jana Laporan</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Tajuk Laporan</FormLabel>
              <Input
                placeholder="Masukkan tajuk laporan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isDisabled={isGenerating}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Pilih Format</FormLabel>
              <Select
                value={showNewPrompt ? 'new' : selectedPrompt}
                onChange={handlePromptSelect}
                isDisabled={isGenerating}
              >
                <option value="">Pilih format yang disimpan</option>
                {savedPrompts.map(p => (
                  <option key={p.id} value={p.text}>
                    {truncateText(p.text)}
                  </option>
                ))}
                <option value="new">+ Format Baru</option>
              </Select>
            </FormControl>

            {showNewPrompt && (
              <Box width="100%">
                <FormControl isRequired>
                  <FormLabel>Format Baru</FormLabel>
                  <VStack spacing={2}>
                    <Textarea
                      placeholder="Masukkan arahan format laporan"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      isDisabled={isGenerating}
                    />
                    <HStack width="100%" justifyContent="flex-end">
                      <Button
                        leftIcon={<FaSave />}
                        size="sm"
                        onClick={handleSavePrompt}
                        isDisabled={isGenerating || !prompt.trim()}
                      >
                        Simpan Format
                      </Button>
                    </HStack>
                  </VStack>
                </FormControl>
              </Box>
            )}

            {savedPrompts.length > 0 && selectedPrompt && !showNewPrompt && (
              <Box width="100%">
                <FormControl>
                  <FormLabel>Format Dipilih</FormLabel>
                  <HStack alignItems="flex-start">
                    <Textarea
                      value={selectedPrompt}
                      isReadOnly
                      rows={4}
                    />
                    <IconButton
                      icon={<FaTrash />}
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeletePrompt(
                        savedPrompts.find(p => p.text === selectedPrompt)?.id
                      )}
                      isDisabled={isGenerating}
                    />
                  </HStack>
                </FormControl>
              </Box>
            )}

          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText="Menjana..."
          >
            Jana
          </Button>
          <Button onClick={handleClose} isDisabled={isGenerating}>
            Batal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReportModal;