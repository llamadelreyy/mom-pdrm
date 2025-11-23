import React, { useRef, useState } from 'react';
import {
  Box,
  Text,
  Progress,
  VStack,
  useColorModeValue,
  Icon,
  Button,
  Flex,
  Circle,
  keyframes,
} from '@chakra-ui/react';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const FileUpload = ({ onFileUpload, onProgress, isUploading, progress }) => {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragover, setIsDragover] = useState(false);
  
  // All useColorModeValue hooks must be called at the top level
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBorderColor = useColorModeValue('primary.500', 'primary.400');
  const dragBorderColor = useColorModeValue('primary.600', 'primary.300');
  const circleBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');
  const uploadingBg = useColorModeValue('gray.50', 'gray.700');
  const uploadingBorder = useColorModeValue('gray.200', 'gray.600');
  const uploadingText = useColorModeValue('gray.700', 'gray.200');
  const progressBg = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.includes('audio/')) {
        alert('Sila pilih fail audio sahaja');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragover(true);
  };

  const handleDragLeave = () => {
    setIsDragover(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragover(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.includes('audio/')) {
        setSelectedFile(file);
      } else {
        alert('Sila pilih fail audio sahaja');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box
        borderWidth="3px"
        borderRadius="2xl"
        borderStyle="dashed"
        borderColor={isDragover ? dragBorderColor : (selectedFile ? 'green.400' : borderColor)}
        bg={bgColor}
        p={12}
        textAlign="center"
        cursor="pointer"
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        transition="all 0.3s ease"
        position="relative"
        overflow="hidden"
        _hover={{
          borderColor: hoverBorderColor,
          transform: 'scale(1.02)',
          shadow: 'lg',
        }}
        _before={selectedFile ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgGradient: 'linear(45deg, rgba(72, 187, 120, 0.02), rgba(56, 178, 172, 0.02))',
          pointerEvents: 'none',
        } : {}}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          style={{ display: 'none' }}
        />
        
        <VStack spacing={4}>
          <Circle
            size="80px"
            bg={circleBg}
            color={selectedFile ? 'green.500' : 'primary.500'}
            animation={isDragover ? `${pulseAnimation} 1.5s infinite` : 'none'}
          >
            <Icon
              as={(props) => {
                if (selectedFile) {
                  return (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      {...props}
                    >
                      <path d="M9 12l2 2 4-4"/>
                      <circle cx="12" cy="12" r="9"/>
                    </svg>
                  );
                }
                return (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    {...props}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                );
              }}
              boxSize={8}
            />
          </Circle>
          
          <VStack spacing={2}>
            <Text
              fontSize="xl"
              fontWeight="700"
              color={selectedFile ? 'green.600' : textColor}
            >
              {selectedFile ? selectedFile.name : 'Pilih fail audio untuk dimuat naik'}
            </Text>
            <Text
              fontSize="md"
              color={subtextColor}
              fontWeight="500"
            >
              {selectedFile
                ? `Saiz fail: ${formatFileSize(selectedFile.size)}`
                : 'Seret dan lepas fail di sini atau klik untuk pilih'
              }
            </Text>
            <Text fontSize="sm" color="gray.500">
              Format yang disokong: MP3, WAV, M4A, FLAC
            </Text>
          </VStack>
        </VStack>
      </Box>

      {selectedFile && !isUploading && (
        <Button
          colorScheme="primary"
          onClick={handleUpload}
          size="lg"
          height="56px"
          fontSize="md"
          fontWeight="700"
          borderRadius="xl"
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
          leftIcon={
            <Icon
              as={(props) => (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  {...props}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            />
          }
        >
          Muat Naik Fail
        </Button>
      )}

      {isUploading && (
        <VStack
          spacing={4}
          p={6}
          bg={uploadingBg}
          borderRadius="xl"
          border="1px"
          borderColor={uploadingBorder}
        >
          <Flex justify="space-between" align="center" w="full">
            <Text fontSize="md" fontWeight="600" color={useColorModeValue('gray.700', 'gray.200')}>
              Memuat naik fail...
            </Text>
            <Text fontSize="md" fontWeight="700" color="primary.500">
              {progress}%
            </Text>
          </Flex>
          <Progress
            value={progress}
            size="lg"
            width="full"
            colorScheme="primary"
            borderRadius="full"
            isAnimated
            hasStripe
            bg={progressBg}
          />
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Sila tunggu sementara fail sedang dimuat naik ke pelayan
          </Text>
        </VStack>
      )}
    </VStack>
  );
};

export default FileUpload;